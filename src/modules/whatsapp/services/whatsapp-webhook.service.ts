import {
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../../prisma.service';
import { WhatsappWebhookDto } from '../interfaces/webhook.interface';
import { WhatsappMessageService } from './whatsapp-message.service';

type WhatsAppMessage =
  WhatsappWebhookDto['entry'][0]['changes'][0]['value']['messages'][0];

@Injectable()
export class WhatsappWebhookService {
  private readonly logger = new Logger(WhatsappWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('whatsapp-messages') private readonly messageQueue: Queue,
    private readonly messageService: WhatsappMessageService,
  ) {}

  async verifyToken(token: string, companyId: number): Promise<void> {
    // Primeiro verifica se a company existe

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      this.logger.error(`Company ${companyId} not found`);
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    if (token !== verifyToken) {
      this.logger.error(`Invalid verify token for company ${companyId}`);
      throw new UnauthorizedException('Invalid verify token');
    }
  }

  async processWebhook(data: WhatsappWebhookDto, companyId: number) {
    try {
      // Verifica se a company existe antes de processar
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        this.logger.error(`Company ${companyId} not found`);
        throw new NotFoundException(`Company ${companyId} not found`);
      }

      // Log do payload completo para debug
      this.logger.debug(
        'Webhook payload completo:',
        JSON.stringify(data, null, 2),
      );

      if (!data.entry || !data.entry.length) {
        this.logger.warn('No entries found in webhook data');
        return { processed: 0 };
      }

      let processedMessages = 0;
      let processedStatuses = 0;

      for (const entry of data.entry) {
        if (!entry.changes || !entry.changes.length) {
          this.logger.warn(`No changes found in entry ${entry.id}`);
          continue;
        }

        for (const change of entry.changes) {
          const value = change.value;

          // Log detalhado da mudança
          this.logger.debug('Processando mudança:', {
            field: change.field,
            value: JSON.stringify(value, null, 2),
          });

          // Processa atualizações de status
          if (value.statuses && value.statuses.length > 0) {
            this.logger.debug('Status encontrados:', value.statuses);
            await this.processStatusUpdates(value.statuses);
            processedStatuses += value.statuses.length;
            this.logger.debug(
              `Processed ${value.statuses.length} status updates`,
            );
          }

          // Processa mensagens recebidas
          if (value.messages && value.messages.length > 0) {
            await this.processMessages(value.messages);
            processedMessages += value.messages.length;
            this.logger.debug(`Processed ${value.messages.length} messages`);
          }
        }
      }

      this.logger.log(
        `Successfully processed ${processedMessages} messages and ${processedStatuses} status updates for company ${companyId}`,
      );

      return {
        processed: {
          messages: processedMessages,
          statuses: processedStatuses,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error processing webhook for company ${companyId}:`,
        error,
      );
      throw error;
    }
  }

  private async processMessage(message: WhatsAppMessage, metadata: any) {
    try {
      // Validação dos dados da mensagem
      if (!message?.from || !message?.id || !metadata?.phone_number_id) {
        throw new Error('Dados da mensagem incompletos');
      }

      // Encontrar ou criar o contato
      const contact = await this.findOrCreateContact(message.from);

      // Encontrar o canal pelo número do WhatsApp
      const channel = await this.prisma.channel.findFirst({
        where: {
          fbNumberPhoneId: metadata.phone_number_id,
          type: 'WHATSAPP_CLOUD',
          active: true,
        },
        include: {
          company: true,
        },
      });

      if (!channel) {
        throw new Error(
          `Canal não encontrado para o número ${metadata.phone_number_id}`,
        );
      }

      // Atualizar o contato com a empresa correta se necessário
      if (contact.companyId !== channel.companyId) {
        await this.prisma.contact.update({
          where: { id: contact.id },
          data: { companyId: channel.companyId },
        });
      }

      // Extrair o conteúdo da mensagem
      const content = this.extractMessageContent(message);

      // Salvar a mensagem
      const savedMessage = await this.prisma.message.create({
        data: {
          messageId: message.id,
          channelId: channel.id,
          from: message.from,
          type: message.type,
          content,
          timestamp: new Date(parseInt(message.timestamp) * 1000),
          status: 'RECEIVED',
          direction: 'INBOUND',
        },
      });

      this.logger.log(`Mensagem ${message.id} processada com sucesso`);
      return {
        success: true,
        messageId: message.id,
        savedMessageId: savedMessage.id,
      };
    } catch (error) {
      this.logger.error(`Erro ao processar mensagem ${message?.id}:`, error);
      throw error;
    }
  }

  private async findOrCreateContact(phone: string) {
    try {
      const contact = await this.prisma.contact.findFirst({
        where: { phone },
      });

      if (contact) {
        return contact;
      }

      // Criar novo contato
      return await this.prisma.contact.create({
        data: {
          name: `WhatsApp ${phone}`, // Nome mais descritivo
          phone,
          // A empresa será atualizada depois quando encontrarmos o canal
          companyId: 1, // TODO: Remover este valor hardcoded
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao processar contato ${phone}:`, error);
      throw error;
    }
  }

  private extractMessageContent(message: WhatsAppMessage): string {
    try {
      switch (message.type) {
        case 'text':
          return message.text?.body || '';

        case 'image':
          return JSON.stringify({
            id: message.image?.id,
            mime_type: message.image?.mime_type,
            caption: message.image?.caption,
          });

        case 'document':
          return JSON.stringify({
            id: message.document?.id,
            filename: message.document?.filename,
            mime_type: message.document?.mime_type,
            caption: message.document?.caption,
          });

        case 'audio':
          return JSON.stringify({
            id: message.audio?.id,
            mime_type: message.audio?.mime_type,
            voice: message.audio?.voice,
          });

        case 'video':
          return JSON.stringify({
            id: message.video?.id,
            mime_type: message.video?.mime_type,
            caption: message.video?.caption,
          });

        default:
          return JSON.stringify(message);
      }
    } catch (error) {
      this.logger.error(
        `Erro ao extrair conteúdo da mensagem ${message?.id}:`,
        error,
      );
      throw error;
    }
  }

  async handleWebhook(body: any) {
    try {
      if (body.object !== 'whatsapp_business_account') {
        return;
      }

      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // Processa atualizações de status
          if (value.statuses) {
            await this.processStatusUpdates(value.statuses);
          }

          // Processa mensagens recebidas
          if (value.messages) {
            await this.processMessages(value.messages);
          }
        }
      }
    } catch (error) {
      this.logger.error('Erro ao processar webhook:', error);
      throw error;
    }
  }

  private async processStatusUpdates(statuses: any[]) {
    for (const status of statuses) {
      try {
        // Log detalhado do status recebido
        this.logger.debug('Status bruto recebido:', {
          status: JSON.stringify(status, null, 2),
        });

        this.logger.debug('Processando status update:', {
          messageId: status.id,
          status: status.status,
          timestamp: status.timestamp,
          recipientId: status.recipient_id,
          conversation: status.conversation,
          pricing: status.pricing,
        });

        // Busca a mensagem no banco
        const message = await this.prisma.message.findFirst({
          where: { messageId: status.id },
        });

        if (!message) {
          this.logger.warn(
            `Mensagem não encontrada para status update: ${status.id}`,
            {
              status: status.status,
              recipientId: status.recipient_id,
            },
          );
          continue;
        }

        // Mapeia o status do WhatsApp para nosso formato
        const mappedStatus = this.mapWhatsAppStatus(status.status);

        this.logger.debug(`Atualizando status da mensagem ${message.id}`, {
          oldStatus: message.status,
          newStatus: mappedStatus,
          messageId: status.id,
          rawStatus: status.status,
        });

        // Atualiza o status da mensagem
        const updatedMessage = await this.prisma.message.update({
          where: { id: message.id },
          data: {
            status: mappedStatus,
            timestamp: new Date(Number(status.timestamp) * 1000),
          },
        });

        this.logger.log(
          `Status atualizado com sucesso: ${status.id} -> ${mappedStatus}`,
          {
            messageId: message.id,
            oldStatus: message.status,
            newStatus: mappedStatus,
            timestamp: new Date(Number(status.timestamp) * 1000),
          },
        );
      } catch (error) {
        this.logger.error(`Erro ao processar status ${status.id}:`, {
          error: error.message,
          status: status.status,
          recipientId: status.recipient_id,
          stack: error.stack,
        });
      }
    }
  }

  private mapWhatsAppStatus(whatsappStatus: string): string {
    this.logger.debug('Mapeando status do WhatsApp:', {
      originalStatus: whatsappStatus,
    });

    // Converte para lowercase para garantir o match
    const status = whatsappStatus.toLowerCase();

    switch (status) {
      case 'sent':
        return 'SENT';
      case 'delivered':
        return 'DELIVERED';
      case 'read':
        return 'READ';
      case 'failed':
        return 'FAILED';
      case 'seen': // Alguns webhooks podem usar 'seen' em vez de 'read'
        return 'READ';
      case 'message_read': // Outro possível formato para status de leitura
        return 'READ';
      default:
        this.logger.warn(
          `Status desconhecido recebido do WhatsApp: ${whatsappStatus}`,
        );
        return 'PENDING';
    }
  }

  private async processMessages(messages: any[]) {
    for (const message of messages) {
      try {
        // Encontrar o canal pelo número do WhatsApp
        const channel = await this.prisma.channel.findFirst({
          where: {
            fbNumberPhoneId: message.metadata?.phone_number_id,
            type: 'WHATSAPP_CLOUD',
            active: true,
          },
        });

        if (!channel) {
          this.logger.warn(`Canal não encontrado para mensagem ${message.id}`);
          continue;
        }

        // Processa mensagem recebida
        await this.messageService.processInboundMessage(message, channel.id);
      } catch (error) {
        this.logger.error(`Erro ao processar mensagem ${message.id}:`, error);
      }
    }
  }
}

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
import { WhatsappMessageService } from '../messages/whatsapp-message.service';

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

      this.logger.debug(
        `Processing webhook data for company ${companyId}:`,
        data,
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

          // Processa atualizações de status
          if (value.statuses && value.statuses.length > 0) {
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
        this.logger.debug('Processando status update:', {
          messageId: status.id,
          status: status.status,
          timestamp: status.timestamp,
          recipientId: status.recipient_id,
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
    switch (whatsappStatus.toLowerCase()) {
      case 'sent':
        return 'SENT';
      case 'delivered':
        return 'DELIVERED';
      case 'read':
        return 'READ';
      case 'failed':
        return 'FAILED';
      default:
        return 'PENDING';
    }
  }

  /* stage 1° - processar webhook */
  private async processMessages(messages: any[]) {
    for (const message of messages) {
      try {
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
        /* stage 2° - processar webhook */
        await this.messageService.processInboundMessage(message, channel.id);
      } catch (error) {
        this.logger.error(`Erro ao processar mensagem ${message.id}:`, error);
      }
    }
  }
}

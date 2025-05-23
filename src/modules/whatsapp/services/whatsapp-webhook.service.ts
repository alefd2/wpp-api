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

type WhatsAppMessage =
  WhatsappWebhookDto['entry'][0]['changes'][0]['value']['messages'][0];

@Injectable()
export class WhatsappWebhookService {
  private readonly logger = new Logger(WhatsappWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('whatsapp-messages') private readonly messageQueue: Queue,
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

      const results = await Promise.all(
        data.entry.map(async (entry) => {
          if (!entry.changes || !entry.changes.length) {
            this.logger.warn(`No changes found in entry ${entry.id}`);
            return null;
          }

          return Promise.all(
            entry.changes.map(async (change) => {
              if (
                !change.value ||
                !change.value.messages ||
                !change.value.messages.length
              ) {
                this.logger.warn(
                  `No messages found in change for entry ${entry.id}`,
                );
                return null;
              }

              // Queue each message for processing
              const queuePromises = change.value.messages.map(
                async (message) => {
                  const jobData = {
                    message,
                    metadata: {
                      businessPhoneNumber:
                        change.value.metadata?.phone_number_id,
                      displayPhoneNumber:
                        change.value.metadata?.display_phone_number,
                    },
                    companyId,
                  };

                  this.logger.debug(
                    `Queueing message for company ${companyId}:`,
                    jobData,
                  );

                  await this.messageQueue.add('process-message', jobData, {
                    attempts: 3,
                    backoff: {
                      type: 'exponential',
                      delay: 2000,
                    },
                  });

                  return message;
                },
              );

              return Promise.all(queuePromises);
            }),
          );
        }),
      );

      const flatResults = results.filter(Boolean).flat().filter(Boolean).flat();

      this.logger.log(
        `Successfully queued ${flatResults.length} messages for company ${companyId}`,
      );

      return {
        processed: flatResults.length,
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
}

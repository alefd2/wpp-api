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
        this.logger.log(`[WEBHOOK] Processando status ${status.id}`);

        const job = await this.messageQueue.add(
          'status',
          {
            messageId: status.id,
            status: status.status,
            timestamp: status.timestamp,
            recipientId: status.recipient_id,
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
            removeOnComplete: {
              age: 24 * 3600,
              count: 1000,
            },
            removeOnFail: {
              age: 24 * 3600,
              count: 1000,
            },
          },
        );

        this.logger.log(`[WEBHOOK] Status ${status.id} adicionado à fila`, {
          jobId: job.id,
          messageId: status.id,
          status: status.status,
        });
      } catch (error) {
        this.logger.error(`[WEBHOOK] Erro ao processar status ${status.id}:`, {
          error: error.message,
          stack: error.stack,
        });
      }
    }
  }

  /* stage 2° - processar webhook e mandar para fila */
  private async processMessages(messages: any[]) {
    for (const message of messages) {
      try {
        this.logger.log(`[WEBHOOK] Processando mensagem ${message.id}`);

        const channel = await this.prisma.channel.findFirst({
          where: {
            fbNumberPhoneId: message.metadata?.phone_number_id,
            type: 'WHATSAPP_CLOUD',
            active: true,
          },
        });

        if (!channel) {
          this.logger.warn(
            `[WEBHOOK] Canal não encontrado para mensagem ${message.id}`,
            {
              phoneNumberId: message.metadata?.phone_number_id,
              messageId: message.id,
            },
          );
          continue;
        }

        this.logger.log(
          `[WEBHOOK] Canal encontrado para mensagem ${message.id}`,
          {
            channelId: channel.id,
            messageId: message.id,
          },
        );

        // Adiciona à fila
        const job = await this.messageQueue.add(
          'receive',
          {
            message,
            channelId: channel.id,
            metadata: message.metadata,
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
            removeOnComplete: {
              age: 24 * 3600,
              count: 1000,
            },
            removeOnFail: {
              age: 24 * 3600,
              count: 1000,
            },
          },
        );

        this.logger.log(`[WEBHOOK] Mensagem ${message.id} adicionada à fila`, {
          jobId: job.id,
          messageId: message.id,
          channelId: channel.id,
        });
      } catch (error) {
        this.logger.error(
          `[WEBHOOK] Erro ao processar mensagem ${message.id}:`,
          {
            error: error.message,
            stack: error.stack,
          },
        );
      }
    }
  }
}

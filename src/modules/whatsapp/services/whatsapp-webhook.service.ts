import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { WhatsappWebhookDto, Message, MessageStatus } from '../interfaces/webhook.interface';
import { WhatsappService } from '../whatsapp.service';

@Injectable()
export class WhatsappWebhookService {
  private readonly logger = new Logger(WhatsappWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
  ) {}

  async processWebhook(data: WhatsappWebhookDto) {
    try {
      // Processar cada entrada do webhook
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const { value } = change;
            const phoneNumberId = value.metadata.phone_number_id;

            // Processar mensagens recebidas
            if (value.messages?.length) {
              await this.processMessages(phoneNumberId, value.messages);
            }

            // Processar status das mensagens
            if (value.statuses?.length) {
              await this.processStatuses(phoneNumberId, value.statuses);
            }
          }
        }
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      throw error;
    }
  }

  private async processMessages(phoneNumberId: string, messages: Message[]) {
    try {
      // Buscar a configuração do WhatsApp pelo phoneNumberId
      const whatsapp = await this.prisma.whatsapp.findFirst({
        where: { number: phoneNumberId }
      });

      if (!whatsapp) {
        throw new Error(`WhatsApp configuration not found for phone number ID: ${phoneNumberId}`);
      }

      // Buscar o canal associado
      const channel = await this.prisma.channel.findFirst({
        where: { 
          companyId: whatsapp.companyId,
          number: phoneNumberId
        }
      });

      if (!channel) {
        throw new Error(`Channel not found for phone number ID: ${phoneNumberId}`);
      }

      // Processar cada mensagem
      for (const message of messages) {
        await this.prisma.message.create({
          data: {
            messageId: message.id,
            from: message.from,
            type: message.type,
            content: this.extractMessageContent(message),
            timestamp: new Date(parseInt(message.timestamp) * 1000),
            status: 'RECEIVED',
            direction: 'INBOUND',
            Whatsapp: {
              connect: { id: whatsapp.id }
            },
            channel: {
              connect: { id: channel.id }
            }
          }
        });

        // TODO: Implementar lógica de notificação em tempo real (WebSocket)
        // TODO: Implementar sistema de respostas automáticas
      }
    } catch (error) {
      this.logger.error('Error processing messages:', error);
      throw error;
    }
  }

  private async processStatuses(phoneNumberId: string, statuses: MessageStatus[]) {
    try {
      // Buscar a configuração do WhatsApp pelo phoneNumberId
      const whatsapp = await this.prisma.whatsapp.findFirst({
        where: { number: phoneNumberId }
      });

      if (!whatsapp) {
        throw new Error(`WhatsApp configuration not found for phone number ID: ${phoneNumberId}`);
      }

      // Atualizar status de cada mensagem
      for (const status of statuses) {
        await this.prisma.message.updateMany({
          where: {
            whatsappId: whatsapp.id,
            messageId: status.id
          },
          data: {
            status: this.mapMessageStatus(status.status),
            updatedAt: new Date(parseInt(status.timestamp) * 1000)
          }
        });
      }
    } catch (error) {
      this.logger.error('Error processing message statuses:', error);
      throw error;
    }
  }

  private extractMessageContent(message: Message): string {
    switch (message.type) {
      case 'text':
        return message.text?.body || '';
      case 'image':
        return JSON.stringify({
          id: message.image?.id,
          caption: message.image?.caption
        });
      case 'document':
        return JSON.stringify({
          id: message.document?.id,
          filename: message.document?.filename,
          caption: message.document?.caption
        });
      case 'audio':
        return JSON.stringify({
          id: message.audio?.id,
          voice: message.audio?.voice
        });
      case 'video':
        return JSON.stringify({
          id: message.video?.id,
          caption: message.video?.caption
        });
      default:
        return JSON.stringify(message);
    }
  }

  private mapMessageStatus(status: string): string {
    switch (status) {
      case 'sent':
        return 'SENT';
      case 'delivered':
        return 'DELIVERED';
      case 'read':
        return 'READ';
      case 'failed':
        return 'FAILED';
      default:
        return 'UNKNOWN';
    }
  }
} 
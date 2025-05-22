import { Injectable, Logger } from '@nestjs/common';
import { WhatsappApiService } from './whatsapp-api.service';

export interface SendMessageDto {
  to: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video';
  text?: string;
  caption?: string;
  mediaUrl?: string;
  filename?: string;
}

@Injectable()
export class WhatsappMessageService {
  private readonly logger = new Logger(WhatsappMessageService.name);

  constructor(private readonly whatsappApi: WhatsappApiService) {}

  async sendMessage(data: SendMessageDto) {
    try {
      const message = this.buildMessage(data);
      const response = await this.whatsappApi.sendMessage(message);
      return response;
    } catch (error) {
      this.logger.error('Error sending message:', error.response?.data || error.message);
      throw error;
    }
  }

  private buildMessage(data: SendMessageDto) {
    const base = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: data.to,
      type: data.type,
    };

    switch (data.type) {
      case 'text':
        return {
          ...base,
          text: {
            body: data.text,
          },
        };

      case 'image':
        return {
          ...base,
          image: {
            link: data.mediaUrl,
            caption: data.caption,
          },
        };

      case 'document':
        return {
          ...base,
          document: {
            link: data.mediaUrl,
            caption: data.caption,
            filename: data.filename,
          },
        };

      case 'audio':
        return {
          ...base,
          audio: {
            link: data.mediaUrl,
          },
        };

      case 'video':
        return {
          ...base,
          video: {
            link: data.mediaUrl,
            caption: data.caption,
          },
        };

      default:
        throw new Error(`Unsupported message type: ${data.type}`);
    }
  }
} 
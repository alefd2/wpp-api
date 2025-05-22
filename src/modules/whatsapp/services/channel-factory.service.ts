import { Injectable, Logger } from '@nestjs/common';
import { ChannelType } from '../enums/channel-type.enum';
import { WhatsappApiService } from './whatsapp-api.service';

export interface ChannelProvider {
  connect(): Promise<any>;
  disconnect(): Promise<any>;
  sendMessage(message: any): Promise<any>;
  getStatus(): Promise<any>;
}

@Injectable()
export class ChannelFactoryService {
  private readonly logger = new Logger(ChannelFactoryService.name);

  constructor(private readonly whatsappApi: WhatsappApiService) {}

  createChannel(type: ChannelType, settings: any): ChannelProvider {
    switch (type) {
      case ChannelType.WHATSAPP_CLOUD:
        return this.whatsappApi;

      case ChannelType.WHATSAPP_ON_PREMISE:
        // TODO: Implementar provedor para WhatsApp Business API local
        throw new Error('WhatsApp On-Premise provider not implemented yet');

      case ChannelType.SMS:
        // TODO: Implementar provedor para SMS
        throw new Error('SMS provider not implemented yet');

      case ChannelType.TELEGRAM:
        // TODO: Implementar provedor para Telegram
        throw new Error('Telegram provider not implemented yet');

      case ChannelType.MESSENGER:
        // TODO: Implementar provedor para Facebook Messenger
        throw new Error('Messenger provider not implemented yet');

      default:
        throw new Error(`Unsupported channel type: ${type}`);
    }
  }
} 
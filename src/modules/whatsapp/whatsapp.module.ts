import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { WhatsappApiService } from './services/whatsapp-api.service';
import { WhatsappMessageService } from './services/whatsapp-message.service';
import { WhatsappWebhookService } from './services/whatsapp-webhook.service';
import { WhatsappAuthService } from './services/whatsapp-auth.service';
import { ChannelFactoryService } from './services/channel-factory.service';
import { ChannelService } from './services/channel.service';
import { PrismaService } from '../../prisma.service';
import { ChannelController } from './channel.controller';

@Module({
  controllers: [WhatsappController, ChannelController],
  providers: [
    WhatsappService,
    WhatsappApiService,
    WhatsappMessageService,
    WhatsappWebhookService,
    WhatsappAuthService,
    ChannelFactoryService,
    ChannelService,
    PrismaService
  ],
  exports: [WhatsappService, WhatsappMessageService, WhatsappWebhookService, WhatsappAuthService]
})
export class WhatsappModule {} 
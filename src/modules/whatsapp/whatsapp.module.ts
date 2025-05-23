import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
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
import { MessageService } from './services/message.service';
import { MessageController } from './message.controller';
import { WhatsappMessageProcessor } from './processors/whatsapp-message.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'whatsapp-messages',
    }),
  ],
  controllers: [WhatsappController, ChannelController, MessageController],
  providers: [
    WhatsappService,
    WhatsappApiService,
    WhatsappMessageService,
    WhatsappWebhookService,
    WhatsappAuthService,
    ChannelFactoryService,
    ChannelService,
    MessageService,
    PrismaService,
    WhatsappMessageProcessor,
  ],
  exports: [
    WhatsappService,
    WhatsappMessageService,
    WhatsappWebhookService,
    WhatsappAuthService,
  ],
})
export class WhatsappModule {}

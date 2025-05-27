import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { WhatsappApiService } from './services/whatsapp-api.service';
import { WhatsappMessageService } from './messages/whatsapp-message.service';
import { WhatsappWebhookService } from './services/whatsapp-webhook.service';
import { WhatsappAuthService } from './services/whatsapp-auth.service';
import { ChannelFactoryService } from './channel/channel-factory.service';
import { PrismaService } from '../../prisma.service';
import { MessageService } from './messages/message.service';
import { MessageController } from './messages/message.controller';
import { ChannelController } from './channel/channel.controller';
import { ChannelService } from './channel/channel.service';
import { TicketService } from './tickets/ticket.service';
import { TicketController } from './tickets/ticket.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'whatsapp-messages',
    }),
  ],
  controllers: [
    WhatsappController,
    ChannelController,
    MessageController,
    TicketController,
  ],
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
    TicketService,
  ],
  exports: [
    WhatsappService,
    WhatsappMessageService,
    WhatsappWebhookService,
    WhatsappAuthService,
  ],
})
export class WhatsappModule {}

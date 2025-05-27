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
import { WhatsappMessageProcessor } from './processors/whatsapp-message.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'whatsapp-messages',
      defaultJobOptions: {
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
    WhatsappMessageProcessor,
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

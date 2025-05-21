import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { PrismaService } from '../prisma.service';
import { SectorModule } from './sector/sector.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
  controllers: [WhatsappController],
  providers: [WhatsappService, PrismaService],
  exports: [WhatsappService],
  imports: [SectorModule, TicketModule],
})
export class WhatsappModule {}

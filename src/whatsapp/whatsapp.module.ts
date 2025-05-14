import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { PrismaService } from '../prisma.service';
import { DepartmentModule } from './department/department.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
  controllers: [WhatsappController],
  providers: [WhatsappService, PrismaService],
  exports: [WhatsappService],
  imports: [DepartmentModule, TicketModule],
})
export class WhatsappModule {}

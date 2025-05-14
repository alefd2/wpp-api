import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [WhatsappModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}

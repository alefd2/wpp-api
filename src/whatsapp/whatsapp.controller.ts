import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('send')
  async sendMessage(@Body() body: { to: string; message: string }) {
    try {
      const result = await this.whatsappService.sendMessage(
        body.to,
        body.message,
      );
      return { success: true, result };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to send message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('webhook')
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return challenge;
    }
    throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    try {
      console.log('\n🔔 ===== NOVO WEBHOOK RECEBIDO =====');
      console.log('⏰', new Date().toISOString());
      console.log('📥 Payload:', JSON.stringify(body, null, 2));

      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (value?.messages) {
        console.log('\n📨 MENSAGENS RECEBIDAS:', value.messages.length);
        for (const message of value.messages) {
          console.log('\n📝 DETALHES DA MENSAGEM:');
          console.log('   👤 De:', message.from);
          console.log('   📱 Tipo:', message.type);
          console.log(
            '   💬 Conteúdo:',
            message.text?.body || message.image?.caption || 'Mídia sem texto',
          );
          console.log(
            '   ⏱️ Timestamp:',
            new Date(Number(message.timestamp) * 1000).toISOString(),
          );
          console.log('   🆔 Message ID:', message.id);

          if (message.image) {
            console.log('   🖼️ Imagem:', {
              id: message.image.id,
              mime_type: message.image.mime_type,
              sha256: message.image.sha256,
              caption: message.image.caption,
            });
          }
        }
      }

      console.log('\n🔄 Processando webhook...');
      const result = await this.whatsappService.handleWebhook(body);
      console.log('✅ Webhook processado com sucesso');
      console.log('📊 Resultado:', result);
      console.log('🔚 ===== FIM DO WEBHOOK =====\n');

      return { status: 'EVENT_RECEIVED' };
    } catch (error) {
      console.error('\n❌ ERRO NO WEBHOOK:');
      console.error('   Mensagem:', error.message);
      console.error('   Stack:', error.stack);
      console.error('   Payload:', JSON.stringify(body, null, 2));
      console.error('🔚 ===== FIM DO WEBHOOK COM ERRO =====\n');

      throw new HttpException(
        error.message || 'Failed to process webhook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('chats/:userId')
  async getChats(@Param('userId') userId: string) {
    try {
      const chats = await this.whatsappService.getChats(Number(userId));
      return { success: true, chats };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get chats',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

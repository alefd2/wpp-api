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

  @Post('webhook')
  async webhook(
    @Body() body: any,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    if (token) {
      // Handle verification
      const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
      if (token === verifyToken) {
        return challenge;
      }
      throw new HttpException('Invalid verify token', HttpStatus.UNAUTHORIZED);
    }

    // Handle webhook events
    try {
      return await this.whatsappService.handleWebhook(body);
    } catch (error) {
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

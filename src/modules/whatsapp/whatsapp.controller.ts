import { Controller, Post, Body, Query, UseGuards, Patch, Get, Param } from '@nestjs/common';
import { WhatsappAuthService } from './services/whatsapp-auth.service';
import { WhatsappAuthDto } from './dto/whatsapp-auth.dto';
import { WhatsappWebhookService } from './services/whatsapp-webhook.service';
import { WhatsappWebhookDto } from './interfaces/webhook.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsappController {
  constructor(
    private readonly authService: WhatsappAuthService,
    private readonly webhookService: WhatsappWebhookService,
    private readonly whatsappService: WhatsappService,
  ) {}

  @Post('auth')
  async authenticate(
    @Body() auth: WhatsappAuthDto,
    @Query('companyId') companyId: string,
  ) {
    return this.authService.authenticate(auth, +companyId);
  }

  @Patch('auth/:id')
  async updateCredentials(
    @Param('id') id: string,
    @Body() auth: WhatsappAuthDto,
    @Query('companyId') companyId: string,
  ) {
    return this.authService.updateCredentials(+id, auth, +companyId);
  }

  @Get('auth/history')
  async getCredentialsHistory(@Query('companyId') companyId: string) {
    return this.authService.getCredentialsHistory(+companyId);
  }

  @Post('webhook')
  async webhook(@Body() data: WhatsappWebhookDto, @Query('verify_token') verifyToken?: string) {
    if (verifyToken) {
      return this.whatsappService.verifyToken(verifyToken);
    }
    
    return this.webhookService.processWebhook(data);
  }
} 
import {
  Controller,
  Post,
  Body,
  Query,
  UseGuards,
  Patch,
  Get,
  Param,
  HttpCode,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { WhatsappAuthService } from './services/whatsapp-auth.service';
import { WhatsappAuthDto } from './dto/whatsapp-auth.dto';
import { WhatsappWebhookService } from './services/whatsapp-webhook.service';
import { WhatsappWebhookDto } from './interfaces/webhook.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Logger } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly authService: WhatsappAuthService,
    private readonly webhookService: WhatsappWebhookService,
  ) {}

  @Post('auth')
  @UseGuards(JwtAuthGuard)
  async authenticate(
    @Body() auth: WhatsappAuthDto,
    @Query('companyId') companyId: string,
  ) {
    return this.authService.authenticate(auth, +companyId);
  }

  @Patch('auth/:id')
  @UseGuards(JwtAuthGuard)
  async updateCredentials(
    @Param('id') id: string,
    @Body() auth: WhatsappAuthDto,
    @Query('companyId') companyId: string,
  ) {
    return this.authService.updateCredentials(+id, auth, +companyId);
  }

  @Get('auth/history')
  @UseGuards(JwtAuthGuard)
  async getCredentialsHistory(@Query('companyId') companyId: string) {
    return this.authService.getCredentialsHistory(+companyId);
  }

  @Post(':id/webhook')
  @Public()
  @HttpCode(200)
  async webhookPost(
    @Param('id') companyId: string,
    @Body() data: WhatsappWebhookDto,
  ) {
    try {
      this.logger.log(
        `[WEBHOOK] Recebido webhook POST para company ${companyId}`,
        {
          object: data.object,
          entryCount: data?.entry?.length || 0,
          hasMessages:
            data?.entry?.[0]?.changes?.[0]?.value?.messages?.length > 0,
          hasStatuses:
            data?.entry?.[0]?.changes?.[0]?.value?.statuses?.length > 0,
        },
      );

      const result = await this.webhookService.processWebhook(
        data,
        parseInt(companyId),
      );

      this.logger.log(`[WEBHOOK] Processamento concluído`, result);
      return result;
    } catch (error) {
      this.logger.error(
        `[WEBHOOK] Erro processando webhook para company ${companyId}:`,
        {
          error: error.message,
          stack: error.stack,
        },
      );
      throw error;
    }
  }

  @Get(':id/webhook')
  @Public()
  @HttpCode(200)
  async webhookGet(
    @Param('id') companyId: string,
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    this.logger.debug(`Received webhook for get company ${companyId}:`);
    try {
      if (mode === 'subscribe' && verifyToken) {
        await this.webhookService.verifyToken(verifyToken, parseInt(companyId));
        res.set('Content-Type', 'text/plain');
        return res.send(challenge);
      }

      return { status: 'ok' };
    } catch (error) {
      this.logger.error(
        `Webhook verification failed for company ${companyId}:`,
        error,
      );
      if (error.status === 404) {
        throw error;
      }
      throw new UnauthorizedException();
    }
  }
}

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
  SetMetadata,
} from '@nestjs/common';
import { Response } from 'express';
import { WhatsappAuthService } from './services/whatsapp-auth.service';
import { WhatsappAuthDto } from './dto/whatsapp-auth.dto';
import { WhatsappWebhookService } from './services/whatsapp-webhook.service';
import { WhatsappWebhookDto } from './interfaces/webhook.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WhatsappService } from './whatsapp.service';
import { SkipAuth } from 'src/common/decorators/skip-auth.decorator';
import { Public } from 'src/common/guards/jwt-auth.guard';
import { Logger } from '@nestjs/common';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly authService: WhatsappAuthService,
    private readonly webhookService: WhatsappWebhookService,
    private readonly whatsappService: WhatsappService,
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
      this.logger.debug(
        `Received webhook for post company ${companyId}:`,
        data,
      );
      return await this.webhookService.processWebhook(
        data,
        parseInt(companyId),
      );
    } catch (error) {
      this.logger.error(
        `Error processing webhook for company ${companyId}:`,
        error,
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

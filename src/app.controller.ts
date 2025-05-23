import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SkipAuth } from './common/decorators/skip-auth.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @SkipAuth()
  getHello() {
    return {
      name: 'WhatsApp API',
      description: 'API para integração com WhatsApp Business API',
      version: '1.0.0',
      docs: '/api/v1/docs',
    };
  }

  @Get('health')
  @SkipAuth()
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'wpp-api',
      version: '1.0.0',
    };
  }
}

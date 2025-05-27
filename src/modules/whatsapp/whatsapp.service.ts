import { Injectable } from '@nestjs/common';
import { BaseService } from '../base/base.service';
import { PrismaService } from '../../prisma.service';
import { Whatsapp } from '@prisma/client';
import { WhatsappApiService } from './services/whatsapp-api.service';

@Injectable()
export class WhatsappService extends BaseService<Whatsapp> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  protected getModelName(): string {
    return 'whatsapp';
  }

  /* INFO: MÉTODOS REMOVIDOS POIS ESTÃO DEPRECATED. JÁ USAMOS O CHANNEL */
}

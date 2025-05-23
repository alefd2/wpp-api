import { Injectable, UnauthorizedException } from '@nestjs/common';
import { BaseService } from '../base/base.service';
import { PrismaService } from '../../prisma.service';
import { Whatsapp } from '@prisma/client';
import { WhatsappConfigDto } from './dto/whatsapp-config.dto';
import { WhatsappApiService } from './services/whatsapp-api.service';
import { WhatsappStatus } from './enums/whatsapp-status.enum';

@Injectable()
export class WhatsappService extends BaseService<Whatsapp> {
  constructor(
    protected readonly prisma: PrismaService,
    private readonly whatsappApi: WhatsappApiService,
  ) {
    super(prisma);
  }

  async findAll(companyId: number) {
    return this.prisma.whatsapp.findMany({
      where: { companyId },
    });
  }

  async findOne(id: number, companyId: number) {
    const whatsapp = await this.prisma.whatsapp.findFirst({
      where: { id, companyId },
    });

    this.validateCompanyAccess(whatsapp, companyId);
    return whatsapp;
  }

  async create(data: WhatsappConfigDto) {
    return this.prisma.whatsapp.create({
      data: {
        ...data,
        status: WhatsappStatus.DISCONNECTED,
      },
    });
  }

  async update(
    id: number,
    data: Partial<WhatsappConfigDto>,
    companyId: number,
  ) {
    const whatsapp = await this.findOne(id, companyId);
    this.validateCompanyAccess(whatsapp, companyId);

    return this.prisma.whatsapp.update({
      where: { id },
      data,
    });
  }

  async delete(id: number, companyId: number) {
    const whatsapp = await this.findOne(id, companyId);
    this.validateCompanyAccess(whatsapp, companyId);

    // Desregistrar o número antes de deletar
    if (whatsapp.status === WhatsappStatus.CONNECTED) {
      await this.disconnect(id, companyId);
    }

    await this.prisma.whatsapp.delete({ where: { id } });
  }

  async connect(id: number, companyId: number) {
    const whatsapp = await this.findOne(id, companyId);
    this.validateCompanyAccess(whatsapp, companyId);

    try {
      // Atualizar status para CONNECTING
      await this.update(id, { status: WhatsappStatus.CONNECTING }, companyId);

      // Verificar status do número
      const status = await this.whatsappApi.checkPhoneNumber();

      if (status.status === WhatsappStatus.ERROR) {
        throw new Error(status.error);
      }

      // Atualizar perfil do número
      await this.whatsappApi.updatePhoneNumber(whatsapp.name);

      // Registrar webhook
      await this.whatsappApi.registerWebhook(process.env.WEBHOOK_URL);

      // Buscar perfil do negócio
      const profile = await this.whatsappApi.getBusinessProfile();

      // Atualizar status para CONNECTED
      return await this.update(
        id,
        {
          status: WhatsappStatus.CONNECTED,
          session: JSON.stringify(profile),
        },
        companyId,
      );
    } catch (error) {
      // Atualizar status para ERROR
      await this.update(
        id,
        {
          status: WhatsappStatus.ERROR,
          session: JSON.stringify({ error: error.message }),
        },
        companyId,
      );
      throw error;
    }
  }

  async disconnect(id: number, companyId: number) {
    const whatsapp = await this.findOne(id, companyId);
    this.validateCompanyAccess(whatsapp, companyId);

    try {
      // Desregistrar o número
      await this.whatsappApi.deregisterPhone();

      return await this.update(
        id,
        {
          status: WhatsappStatus.DISCONNECTED,
          session: null,
          qrcode: null,
        },
        companyId,
      );
    } catch (error) {
      throw error;
    }
  }

  async getStatus(id: number, companyId: number) {
    const whatsapp = await this.findOne(id, companyId);
    this.validateCompanyAccess(whatsapp, companyId);

    try {
      // Verificar status atual na API
      const status = await this.whatsappApi.checkPhoneNumber();

      if (status.status !== whatsapp.status) {
        // Atualizar status no banco se diferente
        await this.update(id, { status: status.status }, companyId);
      }

      return {
        id: whatsapp.id,
        name: whatsapp.name,
        number: whatsapp.number,
        status: status.status,
        qrcode: whatsapp.qrcode,
        session: whatsapp.session,
        profile: status.data,
      };
    } catch (error) {
      return {
        id: whatsapp.id,
        name: whatsapp.name,
        number: whatsapp.number,
        status: WhatsappStatus.ERROR,
        error: error.message,
      };
    }
  }

  async verifyToken(token: string) {
    return this.whatsappApi.verifyToken(token);
  }
}

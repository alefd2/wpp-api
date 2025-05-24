import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import { PrismaService } from '../../../prisma.service';
import { Prisma } from '@prisma/client';
import { WhatsappConfigDto } from '../dto/whatsapp-config.dto';
import { SendMessageDto } from '../messages/dto/send-message.dto';
import { Logger } from '@nestjs/common';
import { WhatsappAuthService } from '../services/whatsapp-auth.service';
import { WhatsappApiService } from '../services/whatsapp-api.service';
import { WhatsappMessageService } from '../messages/whatsapp-message.service';

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messageService: WhatsappMessageService,
  ) {}

  async create(createChannelDto: CreateChannelDto) {
    if (createChannelDto.isDefault) {
      await this.prisma.channel.updateMany({
        where: {
          companyId: createChannelDto.companyId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const credential = await this.prisma.whatsappCredential.findFirst({
      where: {
        id: createChannelDto.whatsappCredentialId,
        companyId: createChannelDto.companyId,
        active: true,
      },
    });

    if (!credential) {
      throw new NotFoundException('Credencial não encontrada ou inativa');
    }

    const channelData: Prisma.ChannelUncheckedCreateInput = {
      name: createChannelDto.name,
      number: createChannelDto.number,
      description: createChannelDto.description,
      type: createChannelDto.type,
      status: 'DISCONNECTED',
      isDefault: createChannelDto.isDefault,
      active: true,
      companyId: createChannelDto.companyId,
      departmentId: createChannelDto.departmentId,
      whatsappCredentialId: createChannelDto.whatsappCredentialId,
      fbNumberPhoneId: createChannelDto.fbNumberPhoneId,
      accountWBId: createChannelDto.accountWBId,
    };

    return this.prisma.channel.create({
      data: channelData,
      include: {
        department: true,
        credential: false,
      },
    });
  }

  async findAll(companyId: number) {
    console.log(companyId);
    const channels = await this.prisma.channel.findMany({
      where: {
        companyId,
        type: 'WHATSAPP_CLOUD',
      },
      include: {
        department: true,
      },
    });

    return channels;
  }

  async findOne(id: number, companyId: number) {
    const channel = await this.prisma.channel.findFirst({
      where: {
        id,
        companyId,
        type: 'WHATSAPP_CLOUD',
      },
      include: {
        department: true,
        credential: true,
      },
    });

    if (!channel) {
      throw new NotFoundException(`Canal #${id} não encontrado`);
    }

    return channel;
  }

  async connect(id: number, companyId: number) {
    const channel = await this.findOne(id, companyId);

    if (!channel.credential) {
      throw new NotFoundException('Canal não possui credencial configurada');
    }

    if (!channel.credential.active) {
      throw new NotFoundException('Credencial do canal está inativa');
    }

    // Verifica se as configurações necessárias existem
    if (!channel.fbNumberPhoneId || !channel.accountWBId) {
      throw new NotFoundException(
        'Canal não possui as configurações necessárias (fbNumberPhoneId e accountWBId)',
      );
    }

    // Atualiza o status do canal
    return this.prisma.channel.update({
      where: { id },
      data: {
        status: 'CONNECTED',
      },
      include: {
        department: true,
        credential: true,
      },
    });
  }

  async disconnect(id: number, companyId: number) {
    await this.findOne(id, companyId);

    return this.prisma.channel.update({
      where: { id },
      data: {
        status: 'DISCONNECTED',
      },
      include: {
        department: true,
        credential: true,
      },
    });
  }

  async getStatus(id: number, companyId: number) {
    const channel = await this.findOne(id, companyId);

    return {
      status: channel.status,
      fbNumberPhoneId: channel.fbNumberPhoneId,
      accountWBId: channel.accountWBId,
      credential: {
        id: channel.credential?.id,
        active: channel.credential?.active,
      },
    };
  }

  async update(
    id: number,
    data: Partial<WhatsappConfigDto>,
    companyId: number,
  ) {
    const channel = await this.findOne(id, companyId);

    const updateData: Prisma.ChannelUpdateInput = {};
    if (data.name) updateData.name = data.name;
    if (data.number) updateData.number = data.number;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    return this.prisma.channel.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
      },
    });
  }

  async remove(id: number, companyId: number) {
    const channel = await this.findOne(id, companyId);

    if (channel.active) {
      throw new Error('Não é possível remover um canal ativo');
    }

    return this.prisma.channel.delete({
      where: { id },
      include: {
        department: false,
        credential: false,
      },
    });
  }

  /* TODO: remover request daqui e colocar no module do messages */
  async sendMessage(id: number, companyId: number, data: SendMessageDto) {
    const channel = await this.findOne(id, companyId);

    if (channel.status !== 'CONNECTED') {
      throw new NotFoundException('Canal não está conectado');
    }

    if (!channel.credential || !channel.credential.active) {
      throw new NotFoundException('Canal não possui credenciais válidas');
    }

    try {
      const response = await this.messageService.sendMessage(channel.id, data);

      return response;
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem pelo canal ${id}:`, error);
      throw error;
    }
  }
}

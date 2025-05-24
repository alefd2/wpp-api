import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Logger } from '@nestjs/common';
import { Message, Ticket, Prisma } from '@prisma/client';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async createSystemMessage(data: {
    ticketId: number;
    content: string;
    category: string;
    metadata?: Record<string, any>;
  }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: data.ticketId },
      select: { channelId: true },
    });

    if (!ticket?.channelId) {
      throw new NotFoundException('Canal do ticket não encontrado');
    }

    const messageData: Prisma.MessageUncheckedCreateInput = {
      messageId: `system_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}`,
      channelId: ticket.channelId,
      ticketId: data.ticketId,
      type: 'text',
      category: data.category,
      origin: 'SYSTEM',
      content: data.content,
      from: 'system',
      status: 'SENT',
      direction: 'OUTBOUND',
      timestamp: new Date(),
      metadata: data.metadata || {},
    };

    return this.prisma.message.create({
      data: messageData,
    });
  }

  async createTicketFromMessage(data: {
    channelId: number;
    contactId: number;
    companyId: number;
    messageId: string;
  }) {
    // Verifica se já existe um ticket ativo para este contato
    const existingTicket = await this.prisma.ticket.findFirst({
      where: {
        contactId: data.contactId,
        status: 'ACTIVE',
        active: true,
      },
    });

    if (existingTicket) {
      this.logger.warn(
        `Tentativa de criar ticket para contato ${data.contactId} que já possui ticket ativo ${existingTicket.id}`,
      );
      throw new ConflictException('Contato já possui um ticket ativo');
    }

    // Busca o departamento geral (default) da empresa
    const defaultDepartment = await this.prisma.department.findFirst({
      where: {
        companyId: data.companyId,
        name: 'Geral',
      },
    });

    if (!defaultDepartment) {
      throw new NotFoundException('Departamento padrão não encontrado');
    }

    // Fecha tickets pendentes ou em espera
    await this.prisma.ticket.updateMany({
      where: {
        contactId: data.contactId,
        status: { in: ['PENDING', 'ON_HOLD'] },
        active: true,
      },
      data: {
        status: 'CLOSED',
        active: false,
        updatedAt: new Date(),
      },
    });

    // Cria um novo ticket
    const ticket = await this.prisma.ticket.create({
      data: {
        protocol: await this.generateProtocol(),
        status: 'ACTIVE',
        priority: 'NORMAL',
        companyId: data.companyId,
        departmentId: defaultDepartment.id,
        contactId: data.contactId,
        channelId: data.channelId,
        active: true,
      },
    });

    // Atualiza a mensagem com o ID do ticket
    await this.prisma.message.update({
      where: {
        id: parseInt(data.messageId),
      },
      data: {
        ticketId: ticket.id,
      },
    });

    // Cria mensagem do sistema informando a criação do ticket
    await this.createSystemMessage({
      ticketId: ticket.id,
      category: 'SYSTEM',
      content: `Ticket #${ticket.protocol} criado e atribuído ao departamento ${defaultDepartment.name}`,
    });

    this.logger.log(
      `Ticket ${ticket.id} criado para contato ${data.contactId} no canal ${data.channelId}`,
    );

    return ticket;
  }

  async transferTicket(data: {
    ticketId: number;
    type: 'USER' | 'DEPARTMENT' | 'CHANNEL';
    fromId?: number;
    toId: number;
    reason?: string;
  }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: data.ticketId },
      include: {
        department: true,
        user: true,
        channel: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket não encontrado');
    }

    // Busca informações da nova entidade (departamento, usuário ou canal)
    let newEntityInfo;
    switch (data.type) {
      case 'DEPARTMENT':
        newEntityInfo = await this.prisma.department.findUnique({
          where: { id: data.toId },
        });
        break;
      case 'USER':
        newEntityInfo = await this.prisma.user.findUnique({
          where: { id: data.toId },
        });
        break;
      case 'CHANNEL':
        newEntityInfo = await this.prisma.channel.findUnique({
          where: { id: data.toId },
        });
        break;
    }

    if (!newEntityInfo) {
      throw new NotFoundException(
        `Novo ${data.type.toLowerCase()} não encontrado`,
      );
    }

    // Cria o registro de transferência
    const transfer = await this.prisma.ticketTransfer.create({
      data: {
        ticketId: data.ticketId,
        type: data.type,
        reason: data.reason,
        ...(data.type === 'USER' && {
          fromUserId: data.fromId,
          toUserId: data.toId,
        }),
        ...(data.type === 'DEPARTMENT' && {
          fromDeptId: data.fromId,
          toDeptId: data.toId,
        }),
        ...(data.type === 'CHANNEL' && {
          fromChannelId: data.fromId,
          toChannelId: data.toId,
        }),
      },
    });

    // Atualiza o ticket com o novo destino
    await this.prisma.ticket.update({
      where: { id: data.ticketId },
      data: {
        ...(data.type === 'USER' && { userId: data.toId }),
        ...(data.type === 'DEPARTMENT' && { departmentId: data.toId }),
        ...(data.type === 'CHANNEL' && { channelId: data.toId }),
      },
    });

    // Cria mensagem do sistema sobre a transferência
    let transferMessage = '';
    switch (data.type) {
      case 'DEPARTMENT':
        transferMessage = `Ticket transferido do departamento ${
          ticket.department?.name || 'sem departamento'
        } para ${newEntityInfo.name}`;
        break;
      case 'USER':
        transferMessage = `Ticket transferido do atendente ${
          ticket.user?.name || 'sem atendente'
        } para ${newEntityInfo.name}`;
        break;
      case 'CHANNEL':
        transferMessage = `Ticket transferido do canal ${
          ticket.channel?.name || 'sem canal'
        } para ${newEntityInfo.name}`;
        break;
    }

    await this.createSystemMessage({
      ticketId: ticket.id,
      category: 'TRANSFER',
      content: transferMessage,
      metadata: {
        transfer: {
          type: data.type,
          from: data.fromId,
          to: data.toId,
          reason: data.reason,
        },
      },
    });

    return transfer;
  }

  async addNote(ticketId: number, userId: number, note: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { channelId: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket não encontrado');
    }

    // Cria uma mensagem do tipo NOTE
    return this.prisma.message.create({
      data: {
        messageId: `note_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}`,
        channelId: ticket.channelId || 0,
        ticketId,
        userId,
        type: 'text',
        category: 'NOTE',
        origin: 'USER',
        content: note,
        from: 'system',
        status: 'SENT',
        direction: 'OUTBOUND',
        timestamp: new Date(),
        metadata: {
          note: {
            userId,
            timestamp: new Date(),
          },
        },
      },
    });
  }

  async closeTicket(ticketId: number, userId: number, reason?: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket não encontrado');
    }

    // Atualiza o status do ticket
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'CLOSED',
        active: false,
        updatedAt: new Date(),
      },
    });

    // Cria mensagem do sistema sobre o fechamento
    await this.createSystemMessage({
      ticketId,
      category: 'CLOSURE',
      content: `Ticket finalizado por ${ticket.user?.name || 'Sistema'}${
        reason ? ` - Motivo: ${reason}` : ''
      }`,
      metadata: {
        closure: {
          userId,
          reason,
          timestamp: new Date(),
        },
      },
    });
  }

  async getTicketTransfers(ticketId: number) {
    return this.prisma.ticketTransfer.findMany({
      where: { ticketId },
      include: {
        fromUser: {
          select: { id: true, name: true },
        },
        toUser: {
          select: { id: true, name: true },
        },
        fromDept: {
          select: { id: true, name: true },
        },
        toDept: {
          select: { id: true, name: true },
        },
        fromChannel: {
          select: { id: true, name: true },
        },
        toChannel: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async generateProtocol(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Busca o último ticket do dia para gerar o número sequencial
    const lastTicket = await this.prisma.ticket.findFirst({
      where: {
        protocol: {
          startsWith: `${year}${month}${day}`,
        },
      },
      orderBy: {
        protocol: 'desc',
      },
    });

    let sequence = '0001';
    if (lastTicket) {
      const lastSequence = parseInt(lastTicket.protocol.slice(-4));
      sequence = String(lastSequence + 1).padStart(4, '0');
    }

    return `${year}${month}${day}${sequence}`;
  }
}

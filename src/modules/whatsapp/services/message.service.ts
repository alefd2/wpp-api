import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Message } from '@prisma/client';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(channelId: number, companyId: number) {
    const channel = await this.prisma.channel.findFirst({
      where: {
        id: channelId,
        companyId,
      },
    });

    if (!channel) {
      throw new NotFoundException('Canal não encontrado');
    }

    return this.prisma.message.findMany({
      where: {
        channelId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
          },
        },
        Ticket: {
          select: {
            id: true,
            protocol: true,
            status: true,
          },
        },
      },
    });
  }

  async findByPhone(phone: string, companyId: number) {
    // Primeiro encontra o canal da empresa
    const channel = await this.prisma.channel.findFirst({
      where: {
        companyId,
        active: true,
      },
    });

    if (!channel) {
      throw new NotFoundException('Canal não encontrado');
    }

    // Busca todas as mensagens relacionadas a este número
    const messages = await this.prisma.message.findMany({
      where: {
        channelId: channel.id,
        OR: [
          { from: phone }, // Mensagens recebidas deste número
          {
            AND: [
              { direction: 'OUTBOUND' },
              { from: phone }, // Mensagens enviadas para este número
            ],
          },
        ],
      },
      orderBy: {
        timestamp: 'asc', // Ordem cronológica para exibição no chat
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
          },
        },
        Ticket: {
          select: {
            id: true,
            protocol: true,
            status: true,
          },
        },
      },
    });

    // Formata as mensagens para o frontend
    return messages.map((message) => ({
      id: message.id,
      messageId: message.messageId,
      type: message.type,
      content: this.parseMessageContent(message.content, message.type),
      timestamp: message.timestamp,
      status: message.status.toLowerCase(),
      direction: message.direction.toLowerCase(),
      sender: {
        id: message.User?.id || null,
        name: message.User?.name || null,
        type: message.direction === 'INBOUND' ? 'customer' : 'agent',
      },
      ticket: message.Ticket
        ? {
            id: message.Ticket.id,
            protocol: message.Ticket.protocol,
            status: message.Ticket.status,
          }
        : null,
    }));
  }

  async findByTicket(ticketId: number, companyId: number) {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: ticketId,
        companyId,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket não encontrado');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        ticketId,
      },
      orderBy: {
        timestamp: 'asc',
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Formata as mensagens para o frontend
    return messages.map((message) => ({
      id: message.id,
      messageId: message.messageId,
      type: message.type,
      content: this.parseMessageContent(message.content, message.type),
      timestamp: message.timestamp,
      status: message.status.toLowerCase(),
      direction: message.direction.toLowerCase(),
      sender: {
        id: message.User?.id || null,
        name: message.User?.name || null,
        type: message.direction === 'INBOUND' ? 'customer' : 'agent',
      },
    }));
  }

  async findOne(id: number, companyId: number) {
    const message = await this.prisma.message.findFirst({
      where: {
        id,
        channel: {
          companyId,
        },
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
          },
        },
        Ticket: {
          select: {
            id: true,
            protocol: true,
            status: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    return {
      id: message.id,
      messageId: message.messageId,
      type: message.type,
      content: this.parseMessageContent(message.content, message.type),
      timestamp: message.timestamp,
      status: message.status.toLowerCase(),
      direction: message.direction.toLowerCase(),
      sender: {
        id: message.User?.id || null,
        name: message.User?.name || null,
        type: message.direction === 'INBOUND' ? 'customer' : 'agent',
      },
      ticket: message.Ticket
        ? {
            id: message.Ticket.id,
            protocol: message.Ticket.protocol,
            status: message.Ticket.status,
          }
        : null,
    };
  }

  private parseMessageContent(content: string, type: string) {
    if (type === 'text') {
      return content;
    }

    try {
      return JSON.parse(content);
    } catch (error) {
      return content;
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Message } from '@prisma/client';
import { TicketService } from '../tickets/ticket.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketService: TicketService,
  ) {}

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
      category: message.category,
      origin: message.origin,
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
      category: message.category,
      origin: message.origin,
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
      category: message.category,
      origin: message.origin,
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

  async markMessagesAsRead(channelId: number, phone: string) {
    try {
      // Atualiza todas as mensagens não lidas deste contato
      const result = await this.prisma.message.updateMany({
        where: {
          channelId,
          from: phone,
          direction: 'INBOUND',
          status: 'RECEIVED',
        },
        data: {
          status: 'READ',
          timestamp: new Date(), // Atualiza o timestamp para quando foi realmente lido
        },
      });

      return {
        success: true,
        updatedCount: result.count,
        message: `${result.count} mensagens marcadas como lidas`,
      };
    } catch (error) {
      throw new Error(`Erro ao marcar mensagens como lidas: ${error.message}`);
    }
  }

  async getUnreadCount(channelId: number, phone: string) {
    try {
      // Conta quantas mensagens não lidas existem deste contato
      const count = await this.prisma.message.count({
        where: {
          channelId,
          from: phone,
          direction: 'INBOUND',
          status: 'RECEIVED',
        },
      });

      return {
        unreadCount: count,
      };
    } catch (error) {
      throw new Error(`Erro ao contar mensagens não lidas: ${error.message}`);
    }
  }

  async findContactsWithMessages(channelId: number, companyId: number) {
    // Verifica se o canal existe
    const channel = await this.prisma.channel.findFirst({
      where: {
        id: channelId,
        companyId,
      },
    });

    if (!channel) {
      throw new NotFoundException('Canal não encontrado');
    }

    // Busca todos os contatos da empresa
    const contacts = await this.prisma.contact.findMany({
      where: {
        companyId,
      },
      include: {
        tickets: {
          where: {
            channelId,
          },
          include: {
            messages: {
              orderBy: {
                timestamp: 'desc',
              },
              take: 1,
            },
            tags: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Para cada contato, busca a última mensagem e informações adicionais
    const contactsWithMessages = await Promise.all(
      contacts.map(async (contact) => {
        // Busca a última mensagem do contato (enviada ou recebida)
        const lastMessage = await this.prisma.message.findFirst({
          where: {
            channelId,
            from: contact.phone,
          },
          orderBy: {
            timestamp: 'desc',
          },
        });

        // Busca contagem de mensagens não lidas
        const unreadCount = await this.prisma.message.count({
          where: {
            channelId,
            from: contact.phone,
            direction: 'INBOUND',
            status: 'RECEIVED',
          },
        });

        const lastTicket = contact.tickets[0];
        const messageContent = lastMessage
          ? this.parseMessageContent(lastMessage.content, lastMessage.type)
          : null;

        return {
          contactId: contact.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          unreadCount,
          tags: lastTicket?.tags.map((tag) => tag.name) || [],
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                text:
                  typeof messageContent === 'string'
                    ? messageContent
                    : JSON.stringify(messageContent),
                timestamp: lastMessage.timestamp,
                status: lastMessage.status.toLowerCase(),
                direction: lastMessage.direction.toLowerCase(),
              }
            : null,
          department: lastTicket?.department || null,
        };
      }),
    );

    // Ordena os contatos: primeiro os que têm mensagens, ordenados pela data da última mensagem
    return contactsWithMessages.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return (
          b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime()
        );
      }
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return 0;
    });
  }

  private formatPhoneNumber(phone: string): string {
    const numbers = phone.replace(/\D/g, '');
    if (
      numbers.startsWith('55') &&
      (numbers.length === 12 || numbers.length === 13)
    ) {
      const ddd = numbers.substring(2, 4);
      const number = numbers.substring(4);
      if (number.length === 8 && !number.startsWith('9')) {
        return `55${ddd}9${number}`;
      }
    }

    return numbers;
  }

  async handleNewMessage(message: Message) {
    try {
      // Se a mensagem já tem um ticket, não precisa processar
      if (message.ticketId) {
        return;
      }

      // Busca a empresa do canal
      const companyId = (await this.getChannelCompany(message.channelId)).id;

      // Formata o número de telefone apenas para mensagens recebidas
      const formattedPhone =
        message.direction === 'INBOUND'
          ? this.formatPhoneNumber(message.from)
          : message.from;

      // Busca o contato existente
      let contact = await this.prisma.contact.findFirst({
        where: {
          phone: formattedPhone,
          companyId,
        },
      });

      // Se não existir, cria um novo contato
      if (!contact) {
        contact = await this.prisma.contact.create({
          data: {
            phone: formattedPhone,
            name: `WhatsApp ${formattedPhone}`, // Nome inicial é o próprio número
            companyId,
            active: true,
          },
        });
        this.logger.log(
          `Novo contato criado: ${contact.id} - ${contact.phone}`,
        );
      }

      // Verifica se o contato tem algum ticket ativo em QUALQUER canal
      const existingActiveTickets = await this.prisma.ticket.findMany({
        where: {
          contactId: contact.id,
          status: 'ACTIVE',
          active: true,
        },
      });

      // Se existirem tickets ativos em outros canais, fecha-os
      if (existingActiveTickets.length > 0) {
        for (const ticket of existingActiveTickets) {
          if (ticket.channelId !== message.channelId) {
            await this.prisma.ticket.update({
              where: { id: ticket.id },
              data: {
                status: 'CLOSED',
                active: false,
                updatedAt: new Date(),
              },
            });
            this.logger.log(
              `Ticket ${ticket.id} do canal ${ticket.channelId} fechado automaticamente devido a nova interação no canal ${message.channelId}`,
            );
          }
        }
      }

      // Busca ticket ativo do contato NO CANAL ATUAL
      const activeTicket = await this.prisma.ticket.findFirst({
        where: {
          contactId: contact.id,
          channelId: message.channelId,
          status: 'ACTIVE',
          active: true,
        },
      });

      // Se não houver ticket ativo no canal atual
      if (!activeTicket) {
        // Primeiro, fecha qualquer ticket que possa estar pendente
        await this.prisma.ticket.updateMany({
          where: {
            contactId: contact.id,
            channelId: message.channelId,
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
        const newTicket = await this.ticketService.createTicketFromMessage({
          channelId: message.channelId,
          contactId: contact.id,
          companyId,
          messageId: message.messageId,
        });

        this.logger.log(
          `Novo ticket criado: ${newTicket.id} para contato ${contact.id}`,
        );

        // Atualiza a mensagem com o ID do novo ticket
        await this.prisma.message.update({
          where: { id: message.id },
          data: {
            ticketId: newTicket.id,
            from: formattedPhone,
          },
        });
      } else {
        // Se existe ticket ativo, apenas associa a mensagem a ele
        await this.prisma.message.update({
          where: { id: message.id },
          data: {
            ticketId: activeTicket.id,
            from: formattedPhone,
          },
        });
        this.logger.log(
          `Mensagem ${message.id} associada ao ticket existente ${activeTicket.id}`,
        );
      }
    } catch (error) {
      this.logger.error('Erro ao processar nova mensagem:', error);
      throw error;
    }
  }

  private async getChannelCompany(channelId: number) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { company: true },
    });

    if (!channel) {
      throw new NotFoundException('Canal não encontrado');
    }

    return channel.company;
  }
}

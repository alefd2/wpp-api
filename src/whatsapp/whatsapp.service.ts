import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import axios from 'axios';
import { MessageStatus, TicketStatus } from '@prisma/client';
import { SendTemplateData } from './whatsapp.controller';

@Injectable()
export class WhatsappService {
  private readonly apiUrl = 'https://graph.facebook.com/v22.0';
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor(private prisma: PrismaService) {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken) {
      throw new Error('WHATSAPP_ACCESS_TOKEN environment variable is not set');
    }
    if (!phoneNumberId) {
      throw new Error(
        'WHATSAPP_PHONE_NUMBER_ID environment variable is not set',
      );
    }

    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
  }

  async sendTextMessage(to: string, message: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Save message to database
      const client = await this.findOrCreateClient(to);
      const ticket = await this.findOrCreateTicket(client.id);

      await this.prisma.message.create({
        data: {
          content: message,
          isFromUser: false,
          ticketId: ticket.id,
          wpId: response.data.messages?.[0]?.id,
          wpStatus: MessageStatus.SENT,
        },
      });

      return response.data;
    } catch (error) {
      console.error(
        'Error sending WhatsApp message:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async sendTemplateMessage(data: SendTemplateData) {
    try {
      // Busca o template no banco
      const savedTemplate = await this.getTemplateByName(
        data.companyId,
        data.name,
      );
      if (!savedTemplate) {
        throw new Error(`Template ${data.name} not found`);
      }

      console.log(savedTemplate.language);
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: data.to,
          type: 'template',
          template: {
            name: data.name,
            language: {
              code: savedTemplate.language || 'pt_BR',
            },
            components: data.components,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Criar ou encontrar cliente
      const client = await this.findOrCreateClient(data.to);
      const ticket = await this.findOrCreateTicket(client.id);

      // Salvar mensagem
      await this.prisma.message.create({
        data: {
          content: data.name,
          isFromUser: false,
          ticketId: ticket.id,
          wpId: response.data.messages?.[0]?.id,
          wpStatus: MessageStatus.SENT,
        },
      });

      return response.data;
    } catch (error) {
      console.error(
        'Error sending template message:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async handleWebhook(body: any) {
    try {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (value?.messages) {
        for (const message of value.messages) {
          const from = message.from;
          const name = message.profile?.name || 'Unknown';
          const text = message.text?.body;
          const wpId = message.id;
          const wpTimestamp = new Date(Number(message.timestamp) * 1000);

          // Criar ou encontrar cliente
          const client = await this.findOrCreateClient(from);

          // Buscar ticket ativo ou criar novo
          let ticket = await this.prisma.ticket.findFirst({
            where: {
              clientId: client.id,
              status: { not: TicketStatus.FINISHED },
            },
          });

          if (!ticket) {
            // Criar novo ticket
            ticket = await this.prisma.ticket.create({
              data: {
                description: `Nova conversa com ${name}`,
                clientId: client.id,
                sectorId: 1, // Setor padrão
                status: TicketStatus.OPEN,
              },
            });

            // Criar histórico de status
            await this.prisma.statusHist.create({
              data: {
                ticketId: ticket.id,
                status: TicketStatus.OPEN,
                description: 'Ticket criado automaticamente via WhatsApp',
                changedByUserId: 1, // User sistema
              },
            });
          }

          // Salvar a mensagem
          await this.prisma.message.create({
            data: {
              ticketId: ticket.id,
              content: text,
              isFromUser: true,
              wpId,
              wpStatus: MessageStatus.DELIVERED,
              wpTimestamp,
            },
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      throw error;
    }
  }

  private async findOrCreateClient(phone: string) {
    let client = await this.prisma.client.findFirst({
      where: { phone },
    });

    if (!client) {
      client = await this.prisma.client.create({
        data: {
          name: 'Unknown',
          phone,
          companyId: 1,
          active: true,
        },
      });
    }

    return client;
  }

  private async findOrCreateTicket(clientId: number) {
    let ticket = await this.prisma.ticket.findFirst({
      where: {
        clientId,
        status: { not: TicketStatus.FINISHED },
      },
    });

    if (!ticket) {
      ticket = await this.prisma.ticket.create({
        data: {
          description: 'Nova conversa iniciada',
          clientId,
          sectorId: 1, // Setor padrão
          status: TicketStatus.OPEN,
        },
      });

      // Criar histórico de status
      await this.prisma.statusHist.create({
        data: {
          ticketId: ticket.id,
          status: TicketStatus.OPEN,
          description: 'Ticket criado automaticamente',
          changedByUserId: 1, // User sistema
        },
      });
    }

    return ticket;
  }

  async getTickets(userId: number) {
    return this.prisma.ticket.findMany({
      where: {
        attendantId: userId,
      },
      include: {
        messages: true,
        client: true,
      },
    });
  }

  async getChats(userId: number) {
    return this.prisma.ticket.findMany({
      where: {
        attendantId: userId,
      },
      include: {
        messages: true,
        attendant: true,
        client: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async getTemplates(companyId: number) {
    return this.prisma.modelMetaMessage.findMany({
      where: {
        companyId,
        active: true,
      },
    });
  }

  async getTemplateByName(companyId: number, name: string) {
    return this.prisma.modelMetaMessage.findFirst({
      where: {
        companyId,
        name,
        active: true,
      },
    });
  }
}

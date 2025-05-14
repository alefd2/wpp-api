import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import axios from 'axios';

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

  async sendMessage(to: string, message: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Save message to database
      const user = await this.findOrCreateUser(to);
      const ticket = await this.findOrCreateTicket(user.id, to);

      await this.prisma.message.create({
        data: {
          content: message,
          isFromUser: false,
          ticketId: ticket.id,
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

  async handleWebhook(body: any) {
    try {
      const entry = body.entry[0];
      const changes = entry.changes[0];
      const value = changes.value;

      if (value.messages) {
        for (const message of value.messages) {
          const from = message.from;
          const text = message.text?.body;

          if (text) {
            // Save incoming message
            const user = await this.findOrCreateUser(from);
            const ticket = await this.findOrCreateTicket(user.id, from);

            await this.prisma.message.create({
              data: {
                content: text,
                isFromUser: true,
                ticketId: ticket.id,
              },
            });
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  private async findOrCreateUser(phone: string) {
    let user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          name: 'Unknown',
          email: `${phone}@placeholder.com`,
        },
      });
    }

    return user;
  }

  private async findOrCreateTicket(userId: number, customerPhone: string) {
    let ticket = await this.prisma.ticket.findFirst({
      where: {
        customerPhone,
        status: { not: 'CLOSED' },
      },
    });

    if (!ticket) {
      ticket = await this.prisma.ticket.create({
        data: {
          title: `Chat with ${customerPhone}`,
          description: 'New conversation started',
          customerPhone,
          createdById: userId,
        },
      });
    }

    return ticket;
  }

  async getTickets(userId: number) {
    return this.prisma.ticket.findMany({
      where: { createdById: userId },
      include: {
        messages: true,
      },
    });
  }

  async getChats(userId: number) {
    return this.prisma.ticket.findMany({
      where: { createdById: userId },
      include: {
        messages: true,
        assignedTo: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }
}

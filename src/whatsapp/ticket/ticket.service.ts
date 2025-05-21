import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class TicketService {
  constructor(private prisma: PrismaService) {}

  async createTicket(data: {
    title: string;
    description: string;
    sectorId: number;
    customerPhone: string;
    createdById: number;
  }) {
    // Find or create client first
    const client =
      (await this.prisma.client.findFirst({
        where: { phone: data.customerPhone },
      })) ||
      (await this.prisma.client.create({
        data: {
          name: 'Unknown',
          phone: data.customerPhone,
          companyId: 1,
          active: true,
        },
      }));

    return this.prisma.ticket.create({
      data: {
        ...data,
        description: data.description,
        clientId: client.id,
        sectorId: data.sectorId,
        status: TicketStatus.OPEN,
      },
      include: {
        sector: true,
      },
    });
  }

  async assignTicket(ticketId: number, attendantId: number) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { attendant: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        attendantId,
        status: TicketStatus.OPEN,
      },
      include: {
        sector: true,
        attendant: true,
      },
    });
  }

  async updateTicketStatus(
    ticketId: number,
    status: TicketStatus,
    userId: number,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { attendant: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.attendantId !== userId) {
      throw new UnauthorizedException('You are not assigned to this ticket');
    }

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status },
      include: {
        sector: true,
        attendant: true,
      },
    });
  }

  async getTicketsBySector(sectorId: number) {
    return this.prisma.ticket.findMany({
      where: { sectorId },
      include: {
        sector: true,
        attendant: true,
        messages: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async getTicketsByUser(userId: number) {
    return this.prisma.ticket.findMany({
      where: { attendantId: userId },
      include: {
        sector: true,
        attendant: true,
        messages: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async addMessage(ticketId: number, content: string, isFromUser: boolean) {
    return this.prisma.message.create({
      data: {
        content,
        isFromUser,
        ticketId,
      },
    });
  }

  async getTicketMessages(ticketId: number) {
    return this.prisma.message.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });
  }
}

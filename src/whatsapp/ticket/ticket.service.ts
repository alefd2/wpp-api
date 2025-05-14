import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TicketStatus, TicketPriority } from '@prisma/client';

@Injectable()
export class TicketService {
  constructor(private prisma: PrismaService) {}

  async createTicket(data: {
    title: string;
    description: string;
    departmentId: number;
    customerPhone: string;
    createdById: number;
  }) {
    return this.prisma.ticket.create({
      data: {
        ...data,
        status: TicketStatus.NEW,
        priority: TicketPriority.MEDIUM,
      },
      include: {
        department: true,
        createdBy: true,
      },
    });
  }

  async assignTicket(ticketId: number, assignedToId: number) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { assignedTo: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedToId,
        status: TicketStatus.ASSIGNED,
      },
      include: {
        department: true,
        assignedTo: true,
        createdBy: true,
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
      include: { assignedTo: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.assignedToId !== userId) {
      throw new UnauthorizedException('You are not assigned to this ticket');
    }

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status },
      include: {
        department: true,
        assignedTo: true,
        createdBy: true,
      },
    });
  }

  async updateTicketPriority(
    ticketId: number,
    priority: TicketPriority,
    userId: number,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { assignedTo: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.assignedToId !== userId) {
      throw new UnauthorizedException('You are not assigned to this ticket');
    }

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { priority },
      include: {
        department: true,
        assignedTo: true,
        createdBy: true,
      },
    });
  }

  async getTicketsByDepartment(departmentId: number) {
    return this.prisma.ticket.findMany({
      where: { departmentId },
      include: {
        department: true,
        assignedTo: true,
        createdBy: true,
        messages: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getTicketsByUser(userId: number) {
    return this.prisma.ticket.findMany({
      where: { assignedToId: userId },
      include: {
        department: true,
        assignedTo: true,
        createdBy: true,
        messages: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
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

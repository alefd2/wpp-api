import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketStatus, TicketPriority } from '@prisma/client';

@Controller('whatsapp/tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  async createTicket(
    @Body()
    data: {
      title: string;
      description: string;
      departmentId: number;
      customerPhone: string;
    },
    @Request() req,
  ) {
    return this.ticketService.createTicket({
      ...data,
      createdById: req.user.id,
    });
  }

  @Post(':id/assign')
  async assignTicket(
    @Param('id') id: string,
    @Body('assignedToId') assignedToId: number,
  ) {
    return this.ticketService.assignTicket(Number(id), assignedToId);
  }

  @Put(':id/status')
  async updateTicketStatus(
    @Param('id') id: string,
    @Body('status') status: TicketStatus,
    @Request() req,
  ) {
    return this.ticketService.updateTicketStatus(
      Number(id),
      status,
      req.user.id,
    );
  }

  @Put(':id/priority')
  async updateTicketPriority(
    @Param('id') id: string,
    @Body('priority') priority: TicketPriority,
    @Request() req,
  ) {
    return this.ticketService.updateTicketPriority(
      Number(id),
      priority,
      req.user.id,
    );
  }

  @Get('department/:departmentId')
  async getTicketsByDepartment(@Param('departmentId') departmentId: string) {
    return this.ticketService.getTicketsByDepartment(Number(departmentId));
  }

  @Get('my-tickets')
  async getMyTickets(@Request() req) {
    return this.ticketService.getTicketsByUser(req.user.id);
  }

  @Post(':id/messages')
  async addMessage(
    @Param('id') id: string,
    @Body('content') content: string,
    @Body('isFromUser') isFromUser: boolean,
  ) {
    return this.ticketService.addMessage(Number(id), content, isFromUser);
  }

  @Get(':id/messages')
  async getTicketMessages(@Param('id') id: string) {
    return this.ticketService.getTicketMessages(Number(id));
  }
}

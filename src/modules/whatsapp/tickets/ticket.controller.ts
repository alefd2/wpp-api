import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TicketService } from './ticket.service';
import {
  TransferTicketDto,
  TransferResponseDto,
} from './dto/transfer-ticket.dto';
import { AddNoteDto } from './dto/add-note.dto';
import { CurrentUser } from '../../../common/decorators/user.decorator';
import { User } from '@prisma/client';

@ApiTags('Tickets')
@ApiBearerAuth()
@Controller('whatsapp/tickets')
@UseGuards(JwtAuthGuard)
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post(':ticketId/notes')
  @ApiOperation({ summary: 'Adicionar nota ao ticket' })
  @ApiResponse({
    status: 201,
    description: 'Nota adicionada com sucesso',
  })
  async addNote(
    @Param('ticketId') ticketId: string,
    @Body() data: AddNoteDto,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.ticketService.addNote(+ticketId, user.id, data.content);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':ticketId/transfer')
  @ApiOperation({ summary: 'Transferir ticket' })
  @ApiResponse({
    status: 201,
    description: 'Ticket transferido com sucesso',
    type: TransferResponseDto,
  })
  async transferTicket(
    @Param('ticketId') ticketId: string,
    @Body() data: TransferTicketDto,
  ) {
    try {
      return await this.ticketService.transferTicket({
        ticketId: +ticketId,
        ...data,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':ticketId/transfers')
  @ApiOperation({ summary: 'Listar transferências do ticket' })
  @ApiResponse({
    status: 200,
    description: 'Lista de transferências',
    type: [TransferResponseDto],
  })
  async getTicketTransfers(@Param('ticketId') ticketId: string) {
    try {
      return await this.ticketService.getTicketTransfers(+ticketId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { MessageService } from './services/message.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('whatsapp/messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('channel/:channelId')
  @ApiOperation({ summary: 'Listar mensagens por canal' })
  @ApiParam({ name: 'channelId', description: 'ID do canal' })
  @ApiQuery({ name: 'companyId', description: 'ID da empresa' })
  async findAllByChannel(
    @Param('channelId') channelId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.messageService.findAll(+channelId, +companyId);
  }

  @Get('phone/:phone')
  @ApiOperation({ summary: 'Listar mensagens por número de telefone' })
  @ApiParam({
    name: 'phone',
    description:
      'Número de telefone no formato internacional (ex: 5511999999999)',
  })
  @ApiQuery({ name: 'companyId', description: 'ID da empresa' })
  async findByPhone(
    @Param('phone') phone: string,
    @Query('companyId') companyId: string,
  ) {
    return this.messageService.findByPhone(phone, +companyId);
  }

  @Get('ticket/:ticketId')
  @ApiOperation({ summary: 'Listar mensagens por ticket' })
  @ApiParam({ name: 'ticketId', description: 'ID do ticket' })
  @ApiQuery({ name: 'companyId', description: 'ID da empresa' })
  async findAllByTicket(
    @Param('ticketId') ticketId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.messageService.findByTicket(+ticketId, +companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar mensagem por ID' })
  @ApiParam({ name: 'id', description: 'ID da mensagem' })
  @ApiQuery({ name: 'companyId', description: 'ID da empresa' })
  async findOne(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
  ) {
    return this.messageService.findOne(+id, +companyId);
  }
}

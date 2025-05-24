import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessageService } from './message.service';
import { WhatsappMessageService } from './whatsapp-message.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { MessageResponseDto } from './dto/message-response.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import {
  ApiCreate,
  ApiDetail,
  ApiList,
} from 'src/common/decorators/swagger.decorator';
import { ContactMessagesDto } from './dto/contact-messages.dto';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('whatsapp/messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly whatsappMessageService: WhatsappMessageService,
  ) {}

  @Get('channel/:channelId')
  @ApiList({
    summary: 'Listar mensagens por canal',
    description: 'Retorna uma lista de mensagens por canal',
    response: { type: MessageResponseDto },
    query: [
      { name: 'companyId', description: 'ID da empresa', required: true },
    ],
  })
  async findAllByChannel(
    @Param('channelId') channelId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.messageService.findAll(+channelId, +companyId);
  }

  @Get('phone/:phone')
  @ApiList({
    summary: 'Listar mensagens por número de telefone',
    description: 'Retorna uma lista de mensagens por número de telefone',
    response: { type: MessageResponseDto },
    query: [
      { name: 'companyId', description: 'ID da empresa', required: true },
    ],
  })
  async findByPhone(
    @Param('phone') phone: string,
    @Query('companyId') companyId: string,
  ) {
    return this.messageService.findByPhone(phone, +companyId);
  }

  @Get('ticket/:ticketId')
  @ApiList({
    summary: 'Listar mensagens por ticket',
    description: 'Retorna uma lista de mensagens por ticket',
    response: { type: MessageResponseDto },
    query: [
      { name: 'companyId', description: 'ID da empresa', required: true },
    ],
  })
  async findAllByTicket(
    @Param('ticketId') ticketId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.messageService.findByTicket(+ticketId, +companyId);
  }

  @Get(':id')
  @ApiDetail({
    summary: 'Buscar mensagem por ID',
    description: 'Retorna uma mensagem específica pelo ID',
    response: { type: MessageResponseDto },
  })
  async findOne(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
  ) {
    return this.messageService.findOne(+id, +companyId);
  }

  @Post('channel/:channelId/mark-as-read')
  @ApiCreate({
    summary: 'Marcar mensagens como lidas',
    description:
      'Marca todas as mensagens recebidas como lidas para um número específico',
    request: MarkAsReadDto,
    response: { type: MessageResponseDto },
  })
  async markMessagesAsRead(
    @Param('channelId') channelId: string,
    @Body() data: MarkAsReadDto,
  ) {
    try {
      return await this.messageService.markMessagesAsRead(
        parseInt(channelId),
        data.phone,
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Erro ao marcar mensagens como lidas',
      );
    }
  }

  @Get('channel/:channelId/unread-count')
  @ApiDetail({
    summary: 'Consultar mensagens não lidas',
    description:
      'Retorna o número de mensagens não lidas para um número específico',
    response: { type: MessageResponseDto },
  })
  @ApiQuery({
    name: 'phone',
    description: 'Número do telefone para consulta',
    required: true,
    type: String,
  })
  async getUnreadCount(
    @Param('channelId') channelId: string,
    @Query('phone') phone: string,
  ) {
    try {
      return await this.messageService.getUnreadCount(
        parseInt(channelId),
        phone,
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Erro ao consultar mensagens não lidas',
      );
    }
  }

  @Post('channel/:channelId/send')
  @ApiCreate({
    summary: 'Enviar mensagem',
    description: 'Envia uma mensagem para um canal específico',
    request: SendMessageDto,
    response: { type: MessageResponseDto },
  })
  async sendMessage(
    @Param('channelId') channelId: string,
    @Query('companyId') companyId: string,
    @Body() messageData: SendMessageDto,
  ) {
    try {
      const response = await this.whatsappMessageService.sendMessage(
        +channelId,
        messageData,
      );
      return response;
    } catch (error) {
      throw new BadRequestException(
        error.response?.data?.error?.message || 'Erro ao enviar mensagem',
      );
    }
  }

  @Get('channel/:channelId/contacts')
  @ApiList({
    summary: 'Listar contatos com mensagens',
    description:
      'Retorna uma lista de contatos com suas últimas mensagens e informações',
    response: { type: ContactMessagesDto, isArray: true },
    query: [
      { name: 'companyId', description: 'ID da empresa', required: true },
    ],
  })
  async findContactsWithMessages(
    @Param('channelId') channelId: string,
    @Query('companyId') companyId: string,
  ) {
    try {
      return await this.messageService.findContactsWithMessages(
        parseInt(channelId),
        parseInt(companyId),
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Erro ao buscar contatos com mensagens',
      );
    }
  }
}

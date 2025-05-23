import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { MessageService } from '../services/message.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('whatsapp/messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('status/:messageId')
  @ApiOperation({
    summary: 'Consultar status da mensagem',
    description: 'Retorna o status atual de uma mensagem específica',
  })
  @ApiResponse({
    status: 200,
    description: 'Status da mensagem',
    schema: {
      properties: {
        id: { type: 'number' },
        messageId: { type: 'string' },
        status: { type: 'string', enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'] },
        timestamp: { type: 'string', format: 'date-time' },
        direction: { type: 'string', enum: ['INBOUND', 'OUTBOUND'] }
      },
    },
  })
  async getMessageStatus(@Param('messageId') messageId: string) {
    return this.messageService.getMessageStatus(messageId);
  }

  @Get('phone/:phone')
  @ApiOperation({
    summary: 'Buscar mensagens por telefone',
    description: 'Retorna todas as mensagens trocadas com um número específico',
  })
  async getMessagesByPhone(
    @Param('phone') phone: string,
    @Query('companyId') companyId: string,
  ) {
    return this.messageService.findByPhone(phone, Number(companyId));
  }
} 
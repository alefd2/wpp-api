import {
  Controller,
  Post,
  Body,
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
import { ChannelService } from '../services/channel.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Channels')
@ApiBearerAuth()
@Controller('whatsapp/channels')
@UseGuards(JwtAuthGuard)
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Post(':id/messages')
  @ApiOperation({
    summary: 'Enviar mensagem',
    description: 'Envia uma mensagem através do canal especificado',
  })
  @ApiResponse({
    status: 201,
    description: 'Mensagem enviada com sucesso',
    schema: {
      properties: {
        messages: {
          type: 'array',
          items: {
            properties: {
              id: { type: 'string' },
              message_id: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Canal não encontrado ou não conectado',
  })
  @ApiResponse({ status: 400, description: 'Dados da mensagem inválidos' })
  async sendMessage(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @Body() data: SendMessageDto,
  ) {
    return this.channelService.sendMessage(Number(id), Number(companyId), data);
  }
}

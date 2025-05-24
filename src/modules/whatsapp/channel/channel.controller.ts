import {
  Controller,
  Post,
  Param,
  UseGuards,
  Get,
  Patch,
  Body,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ChannelService } from './channel.service';
import { CompanyId } from 'src/common/decorators/company.decorator';
import {
  ApiCreate,
  ApiDetail,
  ApiList,
  ApiRemove,
  ApiUpdate,
} from 'src/common/decorators/swagger.decorator';
import { ChannelResponseDto } from './dto/channel-response.dto';
import { CreateChannelDto } from './dto/create-channel.dto';

@ApiTags('Channels')
@ApiBearerAuth()
@Controller('whatsapp/channels')
@UseGuards(JwtAuthGuard)
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Post()
  @ApiCreate({
    summary: 'Criar novo canal',
    description: 'Cria um novo canal',
    request: CreateChannelDto,
    response: { type: ChannelResponseDto },
  })
  async create(@Body() createChannelDto: CreateChannelDto) {
    return this.channelService.create(createChannelDto);
  }

  @Get()
  @ApiList({
    summary: 'Listar todos os canais',
    description: 'Retorna uma lista de todos os canais da empresa',
    response: { type: ChannelResponseDto, isArray: true },
  })
  async findAll(@CompanyId() companyId: number) {
    return this.channelService.findAll(companyId);
  }

  @Get(':id')
  @ApiDetail({
    summary: 'Buscar canal por ID',
    description: 'Retorna um canal específico pelo ID',
    response: { type: ChannelResponseDto },
  })
  async findOne(@Param('id') id: string, @CompanyId() companyId: number) {
    return this.channelService.findOne(Number(id), companyId);
  }

  @Patch(':id/connect')
  @ApiUpdate({
    summary: 'Conectar canal',
    description: 'Conecta um canal específico pelo ID',
  })
  async connect(@Param('id') id: string, @CompanyId() companyId: number) {
    return this.channelService.connect(Number(id), companyId);
  }

  @Patch(':id/disconnect')
  @ApiUpdate({
    summary: 'Desconectar canal',
    description: 'Desconecta um canal específico pelo ID',
  })
  async disconnect(@Param('id') id: string, @CompanyId() companyId: number) {
    return this.channelService.disconnect(Number(id), companyId);
  }

  @Get(':id/status')
  @ApiDetail({
    summary: 'Status do canal',
    description: 'Retorna o status do canal específico pelo ID',
  })
  async getStatus(@Param('id') id: string, @CompanyId() companyId: number) {
    return this.channelService.getStatus(Number(id), companyId);
  }

  @Delete(':id')
  @ApiRemove({
    summary: 'Remover canal',
    description: 'Remove um canal específico pelo ID',
  })
  async remove(@Param('id') id: string, @CompanyId() companyId: number) {
    return this.channelService.remove(Number(id), companyId);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import { ChannelService } from './services/channel.service';
import { WhatsappConfigDto } from './dto/whatsapp-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('whatsapp/channels')
@UseGuards(JwtAuthGuard)
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Post()
  async create(@Body() createChannelDto: CreateChannelDto) {
    return this.channelService.create(createChannelDto);
  }

  @Get()
  async findAll(@Query('companyId') companyId: string) {
    return this.channelService.findAll(Number(companyId));
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
  ) {
    return this.channelService.findOne(Number(id), Number(companyId));
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Partial<WhatsappConfigDto>,
    @Query('companyId') companyId: string,
  ) {
    return this.channelService.update(Number(id), data, Number(companyId));
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Query('companyId') companyId: string) {
    return this.channelService.delete(Number(id), Number(companyId));
  }

  @Post(':id/connect')
  async connect(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
  ) {
    return this.channelService.connect(Number(id), Number(companyId));
  }

  @Post(':id/disconnect')
  async disconnect(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
  ) {
    return this.channelService.disconnect(Number(id), Number(companyId));
  }

  @Get(':id/status')
  async getStatus(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
  ) {
    return this.channelService.getStatus(Number(id), Number(companyId));
  }
  @Post(':id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @Body() data: SendMessageDto,
  ) {
    return this.channelService.sendMessage(Number(id), Number(companyId), data);
  }
}

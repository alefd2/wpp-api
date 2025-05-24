import { ApiProperty } from '@nestjs/swagger';
import { ChannelType } from '../../enums/channel-type.enum';

export class ChannelResponseDto {
  @ApiProperty({ description: 'ID do canal' })
  id: number;

  @ApiProperty({ description: 'Nome do canal' })
  name: string;

  @ApiProperty({ description: 'Número do canal' })
  number: string;

  @ApiProperty({ description: 'Status do canal' })
  status: string;

  @ApiProperty({ description: 'Tipo do canal', enum: ChannelType })
  type: ChannelType;

  @ApiProperty({ description: 'ID da empresa' })
  companyId: number;
}

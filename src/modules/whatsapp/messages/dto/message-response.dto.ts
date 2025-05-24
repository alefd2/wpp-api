import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ description: 'ID da mensagem' })
  id: number;

  @ApiProperty({ description: 'ID do canal' })
  channelId: number;

  @ApiProperty({ description: 'Tipo da mensagem' })
  type: string;

  @ApiProperty({ description: 'Status da mensagem' })
  status: string;

  @ApiProperty({ description: 'Direção da mensagem (entrada/saída)' })
  direction: string;

  @ApiProperty({ description: 'Conteúdo da mensagem' })
  content: string;

  @ApiProperty({ description: 'Data de envio' })
  sentAt: Date;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

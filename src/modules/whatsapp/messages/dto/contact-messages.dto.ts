import { ApiProperty } from '@nestjs/swagger';

export class LastMessageDto {
  @ApiProperty({ description: 'ID da mensagem' })
  id: number;

  @ApiProperty({ description: 'Texto da mensagem' })
  text: string;

  @ApiProperty({ description: 'Data e hora da mensagem' })
  timestamp: Date;

  @ApiProperty({ description: 'Status da mensagem' })
  status: string;

  @ApiProperty({ description: 'Direção da mensagem (entrada/saída)' })
  direction: string;
}

export class ContactMessagesDto {
  @ApiProperty({ description: 'ID do contato' })
  contactId: number;

  @ApiProperty({ description: 'Nome do contato' })
  name: string;

  @ApiProperty({ description: 'Número do telefone' })
  phone: string;

  @ApiProperty({ description: 'Quantidade de mensagens não lidas' })
  unreadCount: number;

  @ApiProperty({
    description: 'Tags do contato',
    type: [String],
    required: false,
  })
  tags?: string[];

  @ApiProperty({ description: 'Última mensagem', type: LastMessageDto })
  lastMessage: LastMessageDto;

  @ApiProperty({ description: 'Departamento', required: false })
  department?: {
    id: number;
    name: string;
  };
}

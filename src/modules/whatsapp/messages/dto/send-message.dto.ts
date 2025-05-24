import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUrl,
  IsNotEmpty,
} from 'class-validator';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  VIDEO = 'video',
}

export class SendMessageDto {
  @ApiProperty({
    description: 'Número do destinatário no formato internacional',
    example: '5511999999999',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Tipo da mensagem',
    enum: MessageType,
    example: MessageType.TEXT,
  })
  @IsEnum(MessageType)
  @IsNotEmpty()
  type: MessageType;

  @ApiProperty({
    description: 'Texto da mensagem (obrigatório para mensagens do tipo text)',
    example: 'Olá, como posso ajudar?',
    required: false,
  })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({
    description: 'Legenda para mídia (opcional para image, document e video)',
    example: 'Foto do produto',
    required: false,
  })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiProperty({
    description:
      'URL da mídia (obrigatório para image, document, audio e video)',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  mediaUrl?: string;

  @ApiProperty({
    description: 'Nome do arquivo (obrigatório para document)',
    example: 'documento.pdf',
    required: false,
  })
  @IsString()
  @IsOptional()
  filename?: string;
}

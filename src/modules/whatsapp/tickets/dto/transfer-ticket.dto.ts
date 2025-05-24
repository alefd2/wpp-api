import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum TransferType {
  USER = 'USER',
  DEPARTMENT = 'DEPARTMENT',
  CHANNEL = 'CHANNEL',
}

export class TransferTicketDto {
  @ApiProperty({
    enum: TransferType,
    description: 'Tipo de transferência',
  })
  @IsEnum(TransferType)
  type: TransferType;

  @ApiProperty({
    description: 'ID de origem (opcional)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  fromId?: number;

  @ApiProperty({
    description: 'ID de destino',
  })
  @IsNumber()
  toId: number;

  @ApiProperty({
    description: 'Motivo da transferência',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class TransferResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  ticketId: number;

  @ApiProperty({ enum: TransferType })
  type: TransferType;

  @ApiProperty({ required: false })
  reason?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  fromUser?: {
    id: number;
    name: string;
  };

  @ApiProperty({ required: false })
  toUser?: {
    id: number;
    name: string;
  };

  @ApiProperty({ required: false })
  fromDept?: {
    id: number;
    name: string;
  };

  @ApiProperty({ required: false })
  toDept?: {
    id: number;
    name: string;
  };

  @ApiProperty({ required: false })
  fromChannel?: {
    id: number;
    name: string;
  };

  @ApiProperty({ required: false })
  toChannel?: {
    id: number;
    name: string;
  };
}

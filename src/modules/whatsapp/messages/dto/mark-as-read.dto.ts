import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class MarkAsReadDto {
  @ApiProperty({
    description: 'Número do telefone para marcar mensagens como lidas',
    example: '5511999999999',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddNoteDto {
  @ApiProperty({
    description: 'Conteúdo da nota',
    example: 'Cliente solicitou mais informações sobre o produto.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

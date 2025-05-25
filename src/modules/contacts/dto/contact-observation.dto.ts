import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { BaseCreateDto, BaseResponseDto } from 'src/modules/base/dto/base.dto';

export class CreateContactObservationDTO extends BaseCreateDto {
  @ApiProperty({
    description: 'Conteúdo da observação',
    example: 'Cliente solicitou orçamento',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'ID do contato',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  contactId: number;
  /* 
  @ApiProperty({
    description: 'ID do usuário que criou a observação',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number; */
}

export class UpdateContactObservationDTO {
  @ApiProperty({
    description: 'Conteúdo da observação',
    example: 'Cliente solicitou orçamento',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class ContactObservationDTO extends BaseResponseDto {
  @ApiProperty({
    description: 'Conteúdo da observação',
    example: 'Cliente solicitou orçamento',
  })
  content: string;

  @ApiProperty({
    description: 'ID do contato',
    example: 1,
  })
  contactId: number;

  @ApiProperty({
    description: 'ID do usuário que criou a observação',
    example: 1,
  })
  userId: number;
}

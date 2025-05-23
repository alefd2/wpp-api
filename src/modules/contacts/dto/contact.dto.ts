import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';
import {
  BaseCreateDto,
  BaseUpdateDto,
  BaseResponseDto,
} from '../../base/dto/base.dto';

export class CreateContactDto extends BaseCreateDto {
  @ApiProperty({
    description: 'Nome do contato',
    example: 'João Silva',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Número do telefone',
    example: '5511999999999',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Email do contato',
    required: false,
    example: 'joao@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;
}

export class UpdateContactDto extends BaseUpdateDto {
  @ApiProperty({
    description: 'Nome do contato',
    required: false,
    example: 'João Silva',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Email do contato',
    required: false,
    example: 'joao@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;
}

export class ContactResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Nome do contato',
    example: 'João Silva',
  })
  name: string;

  @ApiProperty({
    description: 'Número do telefone',
    example: '5511999999999',
  })
  phone: string;

  @ApiProperty({
    description: 'Email do contato',
    required: false,
    example: 'joao@example.com',
  })
  email?: string;
}

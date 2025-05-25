import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';
import { BaseCreateDto } from 'src/modules/base/dto/base.dto';

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

  @ApiProperty({
    required: false,
    description: 'Gênero do contato',
    example: 'Masculino',
  })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({
    required: false,
    description: 'URL do avatar',
    example: 'https://example.com/avatar.jpg',
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({
    required: false,
    description: 'Cidade',
    example: 'São Paulo',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    required: false,
    description: 'Estado',
    example: 'SP',
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({
    required: false,
    description: 'Endereço',
    example: 'Rua das Flores, 123',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    required: false,
    description: 'Complemento do endereço',
    example: 'Apto 45',
  })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiProperty({
    required: false,
    description: 'CEP',
    example: '01001-000',
  })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiProperty({
    required: false,
    description: 'País',
    example: 'Brasil',
  })
  @IsString()
  @IsOptional()
  country?: string;
}

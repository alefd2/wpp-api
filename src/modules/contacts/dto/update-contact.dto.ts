import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class UpdateContactDto {
  @ApiProperty({
    required: false,
    description: 'Nome do contato',
    example: 'João Silva',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    required: false,
    description: 'Número de telefone',
    example: '5511999999999',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    required: false,
    description: 'Email do contato',
    example: 'joao@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    required: false,
    description: 'Status do contato',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({
    required: false,
    description: 'Observações sobre o contato',
    example: 'Cliente VIP',
  })
  @IsString()
  @IsOptional()
  observation?: string;

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

  @ApiProperty({ required: false, description: 'Cidade', example: 'São Paulo' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ required: false, description: 'Estado', example: 'SP' })
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

  @ApiProperty({ required: false, description: 'CEP', example: '01001-000' })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiProperty({ required: false, description: 'País', example: 'Brasil' })
  @IsString()
  @IsOptional()
  country?: string;
}

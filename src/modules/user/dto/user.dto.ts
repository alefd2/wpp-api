import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { BaseResponseDto, BaseCreateDto } from '../../base/dto/base.dto';

export class DepartmentResponseDto {
  @ApiProperty({
    description: 'ID do departamento',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nome do departamento',
    example: 'Vendas',
  })
  name: string;

  @ApiProperty({
    description: 'Status do departamento',
    example: true,
  })
  active: boolean;
}

export class CreateUserDto extends BaseCreateDto {
  @ApiProperty({
    description: 'Nome do usuário',
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'john@example.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: '123456',
  })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string;
}

export class UpdateUserDto {
  @ApiProperty({
    description: 'Nome do usuário',
    example: 'John Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'john@example.com',
    required: false,
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: '123456',
    required: false,
  })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: 'Status do usuário',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({
    description: 'Status de disponibilidade do usuário',
    example: 'online',
    required: false,
    enum: ['online', 'offline', 'ocupado'],
  })
  @IsString()
  @IsOptional()
  status?: string;
}

export class UserResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Nome do usuário',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'john@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Status do usuário',
    example: true,
  })
  active: boolean;

  @ApiProperty({
    description: 'Status de disponibilidade do usuário',
    example: 'online',
    enum: ['online', 'offline', 'ocupado'],
  })
  status: string;

  @ApiProperty({
    description: 'ID da empresa do usuário',
    example: 1,
  })
  companyId: number;

  @ApiProperty({
    description: 'Departamentos do usuário',
    type: [DepartmentResponseDto],
  })
  departments: { department: DepartmentResponseDto }[];
}

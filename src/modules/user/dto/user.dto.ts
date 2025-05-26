import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import {
  BaseResponseDto,
  BaseCreateDto,
  BaseUpdateDto,
} from '../../base/dto/base.dto';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ATTENDANT = 'attendant',
}

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
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'john@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Status do usuário',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

  @ApiProperty({
    description: 'Papel do usuário no sistema',
    enum: UserRole,
    example: UserRole.ATTENDANT,
    default: UserRole.ATTENDANT,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.ATTENDANT;
}

export class UpdateUserDto extends BaseUpdateDto {
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
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: '123456',
    required: false,
  })
  @IsString()
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

  @ApiProperty({
    description: 'Papel do usuário no sistema',
    enum: UserRole,
    example: UserRole.ATTENDANT,
    required: false,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
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
    description: 'Papel do usuário no sistema',
    example: UserRole.ATTENDANT,
    enum: UserRole,
  })
  role: UserRole;

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

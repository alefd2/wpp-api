import { IsString, IsEmail, IsNotEmpty, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { Prisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from './user.dto';

export class CreateUserDto implements Prisma.UserUncheckedCreateInput {
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

  companyId: number;
} 
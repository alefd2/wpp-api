import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsHexColor, IsOptional } from 'class-validator';
import { BaseResponseDto, BaseCreateDto } from '../../base/dto/base.dto';

export class CreateTagDto extends BaseCreateDto {
  @ApiProperty({
    description: 'Nome da tag',
    example: 'Urgente',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Cor da tag em formato hexadecimal',
    example: '#EF4444',
    default: '#666666',
  })
  @IsHexColor()
  @IsOptional()
  color?: string;
}

export class UpdateTagDto {
  @ApiProperty({
    description: 'Nome da tag',
    example: 'Urgente',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Cor da tag em formato hexadecimal',
    example: '#EF4444',
    required: false,
  })
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiProperty({
    description: 'Status da tag',
    example: true,
    required: false,
  })
  @IsOptional()
  active?: boolean;
}

export class TagResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Nome da tag',
    example: 'Urgente',
  })
  name: string;

  @ApiProperty({
    description: 'Cor da tag em formato hexadecimal',
    example: '#EF4444',
  })
  color: string;

  @ApiProperty({
    description: 'ID da empresa',
    example: 1,
  })
  companyId: number;
}

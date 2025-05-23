import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto {
  @ApiProperty({
    description: 'ID único do registro',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID da empresa a qual o registro pertence',
    example: 1,
  })
  companyId: number;

  @ApiProperty({
    description: 'Indica se o registro está ativo',
    example: true,
    default: true,
  })
  active: boolean;

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2024-03-19T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do registro',
    example: '2024-03-19T10:00:00Z',
  })
  updatedAt: Date;
}

export class BaseCreateDto {
  @ApiProperty({
    description: 'Indica se o registro está ativo',
    example: true,
    default: true,
    required: false,
  })
  active?: boolean;
}

export class BaseUpdateDto {
  @ApiProperty({
    description: 'Indica se o registro está ativo',
    example: true,
    required: false,
  })
  active?: boolean;
}

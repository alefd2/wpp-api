import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Prisma } from '@prisma/client';

export class PageOptionsDto {
  @ApiPropertyOptional({
    enum: Prisma.SortOrder,
    default: Prisma.SortOrder.asc,
  })
  @IsEnum(Prisma.SortOrder)
  @IsOptional()
  readonly order?: Prisma.SortOrder = Prisma.SortOrder.asc;

  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page?: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  readonly take?: number = 10;

  get skip(): number {
    return (this.page - 1) * this.take;
  }
}

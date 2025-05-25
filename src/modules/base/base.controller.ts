import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { BaseService } from './base.service';
import { CompanyId } from '../../common/decorators/company.decorator';
import { BaseCreateDto, BaseResponseDto } from './dto/base.dto';
import {
  ApiList,
  ApiDetail,
  ApiCreate,
  ApiUpdate,
  ApiRemove,
} from '../../common/decorators/swagger.decorator';
import { PageOptionsDto } from 'src/common/dto/page-options.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/paginated.decorator';
import { ApiQuery } from '@nestjs/swagger';

export abstract class BaseController<
  T extends BaseResponseDto,
  CreateDto extends BaseCreateDto = BaseCreateDto,
  UpdateDto extends Partial<T> = Partial<T>,
> {
  constructor(protected readonly service: BaseService<T>) {}

  @Get()
  @ApiList({
    response: { type: BaseResponseDto },
  })
  @ApiPaginatedResponse(BaseResponseDto)
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @CompanyId() companyId: number,
    @Query() pageOptionsDto?: PageOptionsDto,
    @Query('search') search?: string,
  ): Promise<T[] | PageDto<T>> {
    if (pageOptionsDto) {
      return this.service.findAllPaginated(companyId, pageOptionsDto, search);
    }
    return this.service.findAll(companyId);
  }

  @Get(':id')
  @ApiDetail({
    response: { type: BaseResponseDto },
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number,
  ): Promise<T> {
    return this.service.findOne(id, companyId);
  }

  @Post()
  @ApiCreate({
    request: BaseCreateDto,
    response: { type: BaseResponseDto },
  })
  async create(
    @Body() data: CreateDto,
    @CompanyId() companyId: number,
  ): Promise<T> {
    return this.service.create({ ...data, companyId });
  }

  @Patch(':id')
  @ApiUpdate({
    request: BaseResponseDto,
    response: { type: BaseResponseDto },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateDto,
    @CompanyId() companyId: number,
  ): Promise<T> {
    return this.service.update(id, data, companyId);
  }

  @Delete(':id')
  @ApiRemove({})
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number,
  ): Promise<void> {
    return this.service.remove(id, companyId);
  }
}

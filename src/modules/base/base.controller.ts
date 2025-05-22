import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { BaseService } from './base.service';
import { CompanyId } from '../../common/decorators/company.decorator';

export abstract class BaseController<T> {
  constructor(protected readonly service: BaseService<T>) {}

  @Get()
  async findAll(@CompanyId() companyId: number) {
    return this.service.findAll(companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CompanyId() companyId: number) {
    return this.service.findOne(+id, companyId);
  }

  @Post()
  async create(@Body() data: any) {
    return this.service.create(data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @CompanyId() companyId: number,
  ) {
    return this.service.update(+id, data, companyId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CompanyId() companyId: number) {
    return this.service.delete(+id, companyId);
  }
}

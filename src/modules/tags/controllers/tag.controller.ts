import {
  Controller,
  UseGuards,
  Body,
  Param,
  ParseIntPipe,
  Get,
  Post,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BaseController } from '../../base/base.controller';
import { TagService } from '../services/tag.service';
import { Tag } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateTagDto, UpdateTagDto, TagResponseDto } from '../dto/tag.dto';
import { CompanyId } from '../../../common/decorators/company.decorator';
import {
  ApiList,
  ApiDetail,
  ApiCreate,
  ApiUpdate,
  ApiRemove,
} from '../../../common/decorators/swagger.decorator';

@ApiTags('Tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagController extends BaseController<
  Tag,
  CreateTagDto,
  UpdateTagDto
> {
  constructor(protected readonly tagService: TagService) {
    super(tagService);
  }

  @Get()
  @ApiList({
    summary: 'Listar todas as tags',
    description: 'Retorna uma lista de todas as tags da empresa',
    response: { type: TagResponseDto, isArray: true },
  })
  findAll(@CompanyId() companyId: number) {
    return this.tagService.findAll(companyId);
  }
  @Get(':id')
  @ApiDetail({
    summary: 'Buscar tag por ID',
    description: 'Retorna uma tag específica pelo ID',
    response: { type: TagResponseDto },
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number,
  ) {
    return this.tagService.findOne(id, companyId);
  }

  @Post()
  @ApiCreate({
    summary: 'Criar nova tag',
    description: 'Cria uma nova tag na empresa',
    request: CreateTagDto,
    response: { type: TagResponseDto },
  })
  create(@Body() createTagDto: CreateTagDto, @CompanyId() companyId: number) {
    return this.tagService.create({ ...createTagDto, companyId });
  }

  @Patch(':id')
  @ApiUpdate({
    summary: 'Atualizar tag',
    description: 'Atualiza os dados de uma tag existente',
    request: UpdateTagDto,
    response: { type: TagResponseDto },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTagDto: UpdateTagDto,
    @CompanyId() companyId: number,
  ) {
    return this.tagService.update(id, updateTagDto, companyId);
  }

  @Delete(':id')
  @ApiRemove({
    summary: 'Remover tag',
    description: 'Remove uma tag da empresa',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number,
  ) {
    return this.tagService.delete(id, companyId);
  }
}

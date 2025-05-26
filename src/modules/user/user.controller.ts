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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BaseController } from '../base/base.controller';
import { UserService } from './user.service';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { CompanyId } from '../../common/decorators/company.decorator';
import {
  ApiList,
  ApiDetail,
  ApiCreate,
  ApiUpdate,
  ApiRemove,
} from '../../common/decorators/swagger.decorator';
import { PageOptionsDto } from 'src/common/dto/page-options.dto';
import { PageDto } from 'src/common/dto/page.dto';

@ApiTags('Usuários')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController extends BaseController<
  User,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(protected readonly userService: UserService) {
    super(userService);
  }

  @Get()
  @ApiList({
    summary: 'Listar todos os usuários',
    description: 'Retorna uma lista de todos os usuários da empresa',
    response: { type: UserResponseDto, isArray: true },
  })
  findAll(
    @CompanyId() companyId: number,
    @Query() pageOptionsDto: PageOptionsDto,
    @Query('search') search?: string,
  ): Promise<PageDto<User>> {
    return this.userService.searchPaginated(companyId, search, pageOptionsDto);
  }

  @Get(':id')
  @ApiDetail({
    summary: 'Buscar usuário por ID',
    description: 'Retorna um usuário específico pelo ID',
    response: { type: UserResponseDto },
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number,
  ) {
    return this.userService.findOne(id, companyId);
  }

  @Post()
  @ApiCreate({
    summary: 'Criar novo usuário',
    description: 'Cria um novo usuário na empresa',
    request: CreateUserDto,
    response: { type: UserResponseDto },
  })
  create(@Body() createUserDto: CreateUserDto, @CompanyId() companyId: number) {
    return this.userService.create({ ...createUserDto, companyId });
  }

  @Patch(':id')
  @ApiUpdate({
    summary: 'Atualizar usuário',
    description: 'Atualiza os dados de um usuário existente',
    request: UpdateUserDto,
    response: { type: UserResponseDto },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CompanyId() companyId: number,
  ) {
    return this.userService.update(id, updateUserDto, companyId);
  }

  @Delete(':id')
  @ApiRemove({
    summary: 'Remover usuário',
    description: 'Remove um usuário da empresa',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number,
  ) {
    return this.userService.delete(id, companyId);
  }
}

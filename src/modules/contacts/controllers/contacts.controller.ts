import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ContactsService } from '../services/contacts.service';
import { ContactResponseDto } from '../dto/contact.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CompanyId } from 'src/common/decorators/company.decorator';
import { Contact } from '@prisma/client';
import {
  ApiList,
  ApiDetail,
  ApiCreate,
  ApiUpdate,
  ApiRemove,
} from '../../../common/decorators/swagger.decorator';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { PageOptionsDto } from 'src/common/dto/page-options.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/paginated.decorator';
import { PageDto } from 'src/common/dto/page.dto';
import { BaseController } from '../../base/base.controller';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController extends BaseController<
  Contact,
  CreateContactDto,
  UpdateContactDto
> {
  constructor(protected readonly contactsService: ContactsService) {
    super(contactsService);
  }

  @Get()
  @ApiPaginatedResponse(ContactResponseDto)
  @ApiList({
    summary: 'Listar todos os contatos',
    description: 'Retorna uma lista paginada de contatos ou filtra por busca',
    response: { type: ContactResponseDto },
    query: [
      {
        name: 'search',
        description: 'Termo para buscar em nome, telefone ou email',
        required: false,
      },
    ],
  })
  async findAll(
    @CompanyId() companyId: number,
    @Query() pageOptionsDto: PageOptionsDto,
    @Query('search') search?: string,
  ): Promise<PageDto<Contact>> {
    if (search) {
      return this.contactsService.searchPaginated(
        companyId,
        search,
        pageOptionsDto,
      );
    }
    return this.contactsService.findAllPaginated(companyId, pageOptionsDto);
  }

  @Get('phone/:phone')
  @ApiDetail({
    summary: 'Buscar contato por telefone',
    description: 'Retorna um contato específico pelo telefone',
    response: { type: ContactResponseDto },
  })
  async findOneByPhone(
    @Param('phone') phone: string,
    @CompanyId() companyId: number,
  ): Promise<Contact> {
    return this.contactsService.findOneByPhone(phone, companyId);
  }

  @Get(':id')
  @ApiDetail({
    summary: 'Buscar contato por ID',
    description: 'Retorna um contato específico pelo ID',
    response: { type: ContactResponseDto },
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number,
  ): Promise<Contact> {
    return this.contactsService.findOne(id, companyId);
  }

  @Post()
  @ApiCreate({
    summary: 'Criar novo contato',
    description: 'Cria um novo contato na base de dados',
    request: CreateContactDto,
    response: { type: ContactResponseDto },
  })
  async create(
    @Body() createContactDto: CreateContactDto,
    @CompanyId() companyId: number,
  ): Promise<Contact> {
    return this.contactsService.create({ ...createContactDto, companyId });
  }

  @Patch(':id')
  @ApiUpdate({
    summary: 'Atualizar contato',
    description: 'Atualiza um contato existente na base de dados',
    request: UpdateContactDto,
    response: { type: ContactResponseDto },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContactDto: UpdateContactDto,
    @CompanyId() companyId: number,
  ): Promise<Contact> {
    return this.contactsService.update(id, updateContactDto, companyId);
  }

  @Delete(':id')
  @ApiRemove({
    summary: 'Remover contato',
    description: 'Remove um contato existente da base de dados',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number,
  ): Promise<void> {
    return this.contactsService.delete(id, companyId);
  }
}

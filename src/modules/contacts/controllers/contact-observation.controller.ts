import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ContactObservationService } from '../services/contact-observation.service';
import {
  CreateContactObservationDTO,
  UpdateContactObservationDTO,
  ContactObservationDTO,
} from '../dto/contact-observation.dto';
import { BaseController } from 'src/modules/base/base.controller';
import { ContactObservation } from '@prisma/client';
import { ApiPaginatedResponse } from 'src/common/decorators/paginated.decorator';
import { ApiCreate, ApiList } from 'src/common/decorators/swagger.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AbilityGuard } from 'src/common/guards/ability.guard';
import { CheckAbility } from 'src/common/decorators/check-ability.decorator';
import { Action } from 'src/common/enums/action.enum';
import { Resource } from 'src/common/enums/resource.enum';
import { PageOptionsDto } from 'src/common/dto/page-options.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CompanyId } from 'src/common/decorators/company.decorator';
import { PageDto } from 'src/common/dto/page.dto';
import { User } from '@prisma/client';

@ApiTags('Contact Observations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AbilityGuard)
@Controller('contact-observations')
export class ContactObservationController extends BaseController<
  ContactObservation,
  CreateContactObservationDTO,
  UpdateContactObservationDTO
> {
  constructor(protected readonly service: ContactObservationService) {
    super(service);
  }

  @Post()
  @CheckAbility({ action: Action.Create, subject: Resource.ContactObservation })
  @ApiCreate({
    summary: 'Create a new contact observation',
    response: { type: ContactObservationDTO },
  })
  override async create(
    @Body() createDto: CreateContactObservationDTO,
    @CompanyId() companyId: number,
    @CurrentUser() user: User,
  ): Promise<ContactObservation> {
    return this.service.create({
      ...createDto,
      companyId,
      userId: user.id,
    });
  }

  @Get('by-contact')
  @CheckAbility({ action: Action.Read, subject: Resource.ContactObservation })
  @ApiPaginatedResponse(ContactObservationDTO)
  @ApiList({
    summary: 'Get all observations for a contact',
    description: 'Return a paginated list of observations.',
    response: { type: ContactObservationDTO },
  })
  async findByContact(
    @CompanyId() companyId: number,
    @Query('contactId', ParseIntPipe) contactId: number,
    @Query('search') search?: string,
    @Query() pageOptionsDto?: PageOptionsDto,
  ): Promise<PageDto<ContactObservation>> {
    return this.service.findByContact(companyId, contactId, pageOptionsDto);
  }

  @Get()
  @CheckAbility({ action: Action.Read, subject: Resource.ContactObservation })
  @ApiPaginatedResponse(ContactObservationDTO)
  @ApiList({
    summary: 'Get all observations',
    description: 'Return a paginated list of observations.',
    response: { type: ContactObservationDTO },
  })
  async findAll(
    @CompanyId() companyId: number,
    @Query() pageOptionsDto?: PageOptionsDto,
    @Query('search') search?: string,
  ): Promise<ContactObservation[] | PageDto<ContactObservation>> {
    if (pageOptionsDto) {
      return this.service.findAllPaginated(companyId, pageOptionsDto, search);
    }
    return this.service.findAll(companyId);
  }

  @Get(':id')
  @CheckAbility({ action: Action.Read, subject: Resource.ContactObservation })
  @ApiOperation({ summary: 'Get a specific observation' })
  @ApiResponse({
    status: 200,
    description: 'Return the observation.',
    type: ContactObservationDTO,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number,
  ): Promise<ContactObservation> {
    return this.service.findOne(id, companyId);
  }

  @Patch(':id')
  @CheckAbility({ action: Action.Update, subject: Resource.ContactObservation })
  @ApiOperation({ summary: 'Update a contact observation' })
  @ApiResponse({
    status: 200,
    description: 'The observation has been successfully updated.',
    type: ContactObservationDTO,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateContactObservationDTO,
    @CompanyId() companyId: number,
  ): Promise<ContactObservation> {
    return this.service.update(id, updateDto, companyId);
  }

  @Delete(':id')
  @CheckAbility({ action: Action.Delete, subject: Resource.ContactObservation })
  @ApiOperation({ summary: 'Delete a contact observation' })
  @ApiResponse({
    status: 200,
    description: 'The observation has been successfully deleted.',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number,
  ): Promise<void> {
    return this.service.remove(id, companyId);
  }
}

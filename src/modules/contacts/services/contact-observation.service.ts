import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateContactObservationDTO,
  UpdateContactObservationDTO,
} from '../dto/contact-observation.dto';
import { ContactObservation, Prisma } from '@prisma/client';
import { BaseService } from 'src/modules/base/base.service';
import { PrismaService } from 'src/prisma.service';
import { PageOptionsDto } from 'src/common/dto/page-options.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { PageMetaDto } from 'src/common/dto/page-meta.dto';

@Injectable()
export class ContactObservationService extends BaseService<ContactObservation> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  protected getModelName(): string {
    return 'contactObservation';
  }

  protected getSearchFields(): string[] {
    return ['content'];
  }

  async create(
    data: CreateContactObservationDTO & {
      companyId: number;
      userId: number;
    },
  ): Promise<ContactObservation> {
    return this.prisma.contactObservation.create({
      data: {
        content: data.content,
        contactId: data.contactId,
        userId: data.userId,
        companyId: data.companyId,
      },
    });
  }

  async findAll(companyId: number): Promise<ContactObservation[]> {
    return this.prisma.contactObservation.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByContact(
    companyId: number,
    contactId: number,
    pageOptionsDto: PageOptionsDto,
    search?: string,
  ): Promise<PageDto<ContactObservation>> {
    const where: Prisma.ContactObservationWhereInput = {
      companyId,
      contactId,
      ...(search && {
        content: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      }),
    };

    const skip = (pageOptionsDto.page - 1) * Number(pageOptionsDto.take);
    const itemCount = await this.prisma.contactObservation.count({ where });
    const observations = await this.prisma.contactObservation.findMany({
      where,
      skip,
      take: Number(pageOptionsDto.take),
      orderBy: {
        createdAt: pageOptionsDto.order,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const pageMetaDto = new PageMetaDto(pageOptionsDto, itemCount);
    return new PageDto(observations, pageMetaDto);
  }

  async findOne(id: number, companyId: number): Promise<ContactObservation> {
    const observation = await this.prisma.contactObservation.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!observation) {
      throw new NotFoundException(`Observação #${id} não encontrada`);
    }

    return observation;
  }

  async update(
    id: number,
    data: UpdateContactObservationDTO,
    companyId: number,
  ): Promise<ContactObservation> {
    await this.findOne(id, companyId);

    return this.prisma.contactObservation.update({
      where: {
        id,
        companyId,
      },
      data: {
        content: data.content,
      },
    });
  }

  async remove(id: number, companyId: number): Promise<void> {
    await this.findOne(id, companyId);

    await this.prisma.contactObservation.delete({
      where: {
        id,
        companyId,
      },
    });
  }
}

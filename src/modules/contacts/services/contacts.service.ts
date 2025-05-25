import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { Contact, Prisma } from '@prisma/client';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { PageOptionsDto } from 'src/common/dto/page-options.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { PageMetaDto } from 'src/common/dto/page-meta.dto';
import { BaseService } from '../../base/base.service';

@Injectable()
export class ContactsService extends BaseService<Contact> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  protected getModelName(): string {
    return 'contact';
  }

  protected getSearchFields(): string[] {
    return ['name', 'phone', 'email'];
  }

  async create(
    data: CreateContactDto & { companyId: number },
  ): Promise<Contact> {
    const existingContact = await this.prisma.contact.findFirst({
      where: {
        phone: data.phone,
        companyId: data.companyId,
      },
    });

    if (existingContact) {
      return existingContact;
    }

    return this.prisma.contact.create({
      data: {
        ...data,
        active: true,
      },
    });
  }

  async findAll(companyId: number): Promise<Contact[]> {
    return this.prisma.contact.findMany({
      where: {
        companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number, companyId: number): Promise<Contact> {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contato #${id} não encontrado`);
    }

    return contact;
  }

  async findOneByPhone(phone: string, companyId: number): Promise<Contact> {
    const contact = await this.prisma.contact.findFirst({
      where: {
        phone,
        companyId,
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contato #${phone} não encontrado`);
    }

    return contact;
  }

  async update(
    id: number,
    data: UpdateContactDto,
    companyId: number,
  ): Promise<Contact> {
    await this.findOne(id, companyId);

    return this.prisma.contact.update({
      where: { id },
      data,
    });
  }

  async delete(id: number, companyId: number): Promise<void> {
    await this.findOne(id, companyId);

    await this.prisma.contact.delete({
      where: { id },
    });
  }

  async searchPaginated(
    companyId: number,
    query: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Contact>> {
    const where: Prisma.ContactWhereInput = {
      companyId,
      OR: [
        {
          name: {
            contains: query,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          phone: {
            contains: query,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          email: {
            contains: query,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ],
    };

    const skip = (pageOptionsDto.page - 1) * Number(pageOptionsDto.take);
    const itemCount = await this.prisma.contact.count({ where });
    const contacts = await this.prisma.contact.findMany({
      where,
      skip,
      take: Number(pageOptionsDto.take),
      orderBy: {
        name: pageOptionsDto.order,
      },
    });

    const pageMetaDto = new PageMetaDto(pageOptionsDto, itemCount);
    return new PageDto(contacts, pageMetaDto);
  }

  async search(companyId: number, query: string): Promise<Contact[]> {
    return this.prisma.contact.findMany({
      where: {
        companyId,
        OR: [
          {
            name: {
              contains: query,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            phone: {
              contains: query,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            email: {
              contains: query,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

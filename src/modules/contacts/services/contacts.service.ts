import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { CreateContactDto, UpdateContactDto } from '../dto/contact.dto';
import { BaseService } from '../../base/base.service';
import { Contact } from '@prisma/client';

@Injectable()
export class ContactsService extends BaseService<Contact> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
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

  async update(
    id: number,
    data: UpdateContactDto,
    companyId: number,
  ): Promise<Contact> {
    const contact = await this.findOne(id, companyId);
    this.validateCompanyAccess({ companyId: contact.companyId }, companyId);

    return this.prisma.contact.update({
      where: { id },
      data,
    });
  }

  async delete(id: number, companyId: number): Promise<void> {
    const contact = await this.findOne(id, companyId);
    this.validateCompanyAccess({ companyId: contact.companyId }, companyId);

    await this.prisma.contact.delete({
      where: { id },
    });
  }

  async search(companyId: number, query: string): Promise<Contact[]> {
    return this.prisma.contact.findMany({
      where: {
        companyId,
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: query,
              mode: 'insensitive',
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

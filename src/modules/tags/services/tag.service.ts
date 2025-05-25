import { Injectable, ConflictException } from '@nestjs/common';
import { BaseService } from '../../base/base.service';
import { PrismaService } from '../../../prisma.service';
import { Tag } from '@prisma/client';
import { CreateTagDto } from '../dto/tag.dto';

@Injectable()
export class TagService extends BaseService<Tag> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  protected getModelName(): string {
    return 'tag';
  }

  async findAll(companyId: number) {
    return this.prisma.tag.findMany({
      where: { companyId },
      include: {
        tickets: true,
      },
    });
  }

  async findOne(id: number, companyId: number) {
    const tag = await this.prisma.tag.findFirst({
      where: { id, companyId },
      include: {
        tickets: true,
      },
    });

    this.validateCompanyAccess(tag, companyId);
    return tag;
  }

  async create(data: CreateTagDto & { companyId: number }): Promise<Tag> {
    const existingTag = await this.prisma.tag.findFirst({
      where: {
        name: data.name,
        companyId: data.companyId,
      },
    });

    if (existingTag) {
      throw new ConflictException('Tag already exists for this company');
    }

    this.validateCompanyAccess(data, data.companyId);

    return this.prisma.tag.create({
      data: {
        ...data,
        color: data.color || '#666666',
      },
      include: {
        tickets: true,
      },
    });
  }

  async update(id: number, data: Partial<CreateTagDto>, companyId: number) {
    const tag = await this.findOne(id, companyId);
    this.validateCompanyAccess(tag, companyId);

    if (data.name) {
      const existingTag = await this.prisma.tag.findFirst({
        where: {
          name: data.name,
          companyId,
          id: { not: id },
        },
      });

      if (existingTag) {
        throw new ConflictException('Tag name already exists for this company');
      }
    }

    return this.prisma.tag.update({
      where: { id },
      data,
      include: {
        tickets: true,
      },
    });
  }

  async delete(id: number, companyId: number) {
    const tag = await this.findOne(id, companyId);
    this.validateCompanyAccess(tag, companyId);

    await this.prisma.tag.delete({ where: { id } });
  }
}

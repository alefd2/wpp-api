import { Injectable, ConflictException } from '@nestjs/common';
import { BaseService } from '../../base/base.service';
import { PrismaService } from '../../../prisma.service';
import { Prisma, Tag } from '@prisma/client';
import { CreateTagDto } from '../dto/tag.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { PageOptionsDto } from 'src/common/dto/page-options.dto';
import { PageMetaDto } from 'src/common/dto/page-meta.dto';

@Injectable()
export class TagService extends BaseService<Tag> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  protected getModelName(): string {
    return 'tag';
  }

  protected getSearchFields(): string[] {
    return ['name'];
  }

  async searchPaginated(
    companyId: number,
    query: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Tag>> {
    const where: Prisma.TagWhereInput = {
      companyId,
      OR: [
        {
          name: {
            contains: query,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ],
    };

    const skip = (pageOptionsDto.page - 1) * Number(pageOptionsDto.take);
    const itemCount = await this.prisma.tag.count({ where });
    const contacts = await this.prisma.tag.findMany({
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

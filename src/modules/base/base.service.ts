import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PageOptionsDto } from 'src/common/dto/page-options.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { PageMetaDto } from 'src/common/dto/page-meta.dto';
import { Prisma } from '@prisma/client';

export abstract class BaseService<T extends { companyId: number }> {
  constructor(protected readonly prisma: PrismaService) {}

  protected abstract getModelName(): string;

  protected getSearchFields(): string[] {
    return ['name'];
  }

  private buildSearchQuery(query: string): any[] {
    return this.getSearchFields().map((field) => ({
      [field]: {
        contains: query,
        mode: Prisma.QueryMode.insensitive,
      },
    }));
  }

  async findAllPaginated(
    companyId: number,
    pageOptionsDto: PageOptionsDto,
    search?: string,
  ): Promise<PageDto<T>> {
    const where: any = { companyId };

    if (search) {
      where.OR = this.buildSearchQuery(search);
    }

    const skip = (pageOptionsDto.page - 1) * Number(pageOptionsDto.take);

    const itemCount = await this.prisma[this.getModelName()].count({ where });
    const items = await this.prisma[this.getModelName()].findMany({
      where,
      skip,
      take: Number(pageOptionsDto.take),
      orderBy: {
        name: pageOptionsDto.order,
      },
    });

    const pageMetaDto = new PageMetaDto(pageOptionsDto, itemCount);
    return new PageDto(items, pageMetaDto);
  }

  async findAll(companyId: number): Promise<T[]> {
    return this.prisma[this.getModelName()].findMany({
      where: {
        companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number, companyId: number): Promise<T> {
    const item = await this.prisma[this.getModelName()].findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!item) {
      throw new NotFoundException(
        `${this.getModelName()} #${id} não encontrado`,
      );
    }

    return item;
  }

  async create(data: any & { companyId: number }): Promise<T> {
    if (!data.companyId) {
      throw new ForbiddenException('CompanyId é obrigatório');
    }

    return this.prisma[this.getModelName()].create({
      data,
    });
  }

  async update(id: number, data: Partial<T>, companyId: number): Promise<T> {
    const existingItem = await this.findOne(id, companyId);
    this.validateCompanyAccess(existingItem, companyId);

    return this.prisma[this.getModelName()].update({
      where: { id },
      data: {
        ...data,
        companyId,
      },
    });
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existingItem = await this.findOne(id, companyId);
    this.validateCompanyAccess(existingItem, companyId);

    await this.prisma[this.getModelName()].delete({
      where: { id },
    });
  }

  protected validateCompanyAccess(
    model: { companyId: number },
    companyId: number,
  ): void {
    if (!model || model.companyId !== companyId) {
      throw new ForbiddenException('Acesso não autorizado a este recurso');
    }
  }
}

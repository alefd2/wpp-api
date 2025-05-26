import { Injectable, ConflictException } from '@nestjs/common';
import { BaseService } from '../base/base.service';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma, User } from '@prisma/client';
import { CreateUserDto, UserRole } from './dto/user.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { PageOptionsDto } from 'src/common/dto/page-options.dto';
import { PageMetaDto } from 'src/common/dto/page-meta.dto';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  protected getModelName(): string {
    return 'user';
  }

  protected getSearchFields(): string[] {
    return ['name', 'email'];
  }

  async findAll(companyId: number) {
    return this.prisma.user.findMany({
      where: { companyId },
      include: {
        departments: {
          include: {
            department: true,
          },
        },
      },
    });
  }

  async searchPaginated(
    companyId: number,
    query: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<User>> {
    const where: Prisma.UserWhereInput = {
      companyId,
      OR: [
        {
          name: {
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
    const itemCount = await this.prisma.user.count({ where });
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: Number(pageOptionsDto.take),
      orderBy: {
        name: pageOptionsDto.order,
      },
    });

    const pageMetaDto = new PageMetaDto(pageOptionsDto, itemCount);
    return new PageDto(users, pageMetaDto);
  }

  async findOne(id: number, companyId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
      include: {
        departments: {
          include: {
            department: true,
          },
        },
      },
    });

    this.validateCompanyAccess(user, companyId);
    return user;
  }

  async create(data: CreateUserDto & { companyId: number }): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    this.validateCompanyAccess(data, data.companyId);

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: data.role || UserRole.ATTENDANT,
      },
      include: {
        departments: {
          include: {
            department: true,
          },
        },
      },
    });
  }

  async update(id: number, data: Partial<CreateUserDto>, companyId: number) {
    const user = await this.findOne(id, companyId);
    this.validateCompanyAccess(user, companyId);

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        departments: {
          include: {
            department: true,
          },
        },
      },
    });
  }

  async delete(id: number, companyId: number) {
    const user = await this.findOne(id, companyId);
    this.validateCompanyAccess(user, companyId);

    await this.prisma.user.delete({ where: { id } });
  }
}

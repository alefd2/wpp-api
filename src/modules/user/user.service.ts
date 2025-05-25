import { Injectable, ConflictException } from '@nestjs/common';
import { BaseService } from '../base/base.service';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { CreateUserDto } from './dto/user.dto';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  protected getModelName(): string {
    return 'user';
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

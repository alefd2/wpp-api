import { PrismaService } from '../../prisma.service';

export abstract class BaseService<T> {
  constructor(protected readonly prisma: PrismaService) {}

  abstract findAll(companyId: number): Promise<T[]>;
  abstract findOne(id: number, companyId: number): Promise<T>;
  abstract create(data: any): Promise<T>;
  abstract update(id: number, data: Partial<T>, companyId: number): Promise<T>;
  abstract delete(id: number, companyId: number): Promise<void>;

  protected validateCompanyAccess(
    entity: { companyId?: number },
    companyId: number,
  ): void {
    if (entity?.companyId !== companyId) {
      throw new Error('Access denied to this resource');
    }
  }
}

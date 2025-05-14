import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  async createDepartment(name: string, description?: string) {
    return this.prisma.department.create({
      data: {
        name,
        description,
      },
    });
  }

  async getAllDepartments() {
    return this.prisma.department.findMany();
  }

  async getDepartmentById(id: number) {
    return this.prisma.department.findUnique({
      where: { id },
      include: {
        tickets: {
          include: {
            messages: true,
            assignedTo: true,
          },
        },
      },
    });
  }

  async updateDepartment(id: number, name: string, description?: string) {
    return this.prisma.department.update({
      where: { id },
      data: {
        name,
        description,
      },
    });
  }

  async deleteDepartment(id: number) {
    return this.prisma.department.delete({
      where: { id },
    });
  }

  async getTicketsByDepartment(departmentId: number) {
    return this.prisma.ticket.findMany({
      where: { departmentId },
      include: {
        messages: true,
        assignedTo: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async assignMessageToDepartment(messageId: number, departmentId: number) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: { ticket: { update: { departmentId } } },
    });
  }

  async getMessagesByDepartment(departmentId: number) {
    return this.prisma.message.findMany({
      where: { ticket: { departmentId } },
      include: { ticket: true },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class SectorService {
  constructor(private prisma: PrismaService) {}

  async createSector(name: string, description?: string) {
    return this.prisma.sector.create({
      data: {
        name,
        description: description ? description : '',
      },
    });
  }

  async getAllSectors() {
    return this.prisma.sector.findMany();
  }

  async getSectorById(id: number) {
    return this.prisma.sector.findUnique({
      where: { id },
      include: {
        tickets: {
          include: {
            messages: true,
            attendant: true,
          },
        },
      },
    });
  }

  async updateSector(id: number, name: string, description?: string) {
    return this.prisma.sector.update({
      where: { id },
      data: {
        name,
        description,
      },
    });
  }

  async deleteSector(id: number) {
    return this.prisma.sector.delete({
      where: { id },
    });
  }

  async getTicketsBySector(sectorId: number) {
    return this.prisma.ticket.findMany({
      where: { sectorId },
      include: {
        messages: true,
        attendant: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async assignMessageToSector(messageId: number, sectorId: number) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: { ticket: { update: { sectorId } } },
    });
  }

  async getMessagesBySector(sectorId: number) {
    return this.prisma.message.findMany({
      where: { ticket: { sectorId } },
      include: { ticket: true },
    });
  }
}

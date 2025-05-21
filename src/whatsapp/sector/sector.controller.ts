import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { SectorService } from './sector.service';

@Controller('whatsapp/departments')
export class DepartmentController {
  constructor(private readonly sectorService: SectorService) {}

  @Post()
  async createSector(
    @Body('name') name: string,
    @Body('description') description?: string,
  ) {
    return this.sectorService.createSector(name, description);
  }

  @Get()
  async getAllSectors() {
    return this.sectorService.getAllSectors();
  }

  @Get(':id')
  async getSectorById(@Param('id') id: string) {
    return this.sectorService.getSectorById(Number(id));
  }

  @Put(':id')
  async updateDepartment(
    @Param('id') id: string,
    @Body('name') name: string,
    @Body('description') description?: string,
  ) {
    return this.sectorService.updateSector(Number(id), name, description);
  }

  @Delete(':id')
  async deleteSector(@Param('id') id: string) {
    return this.sectorService.deleteSector(Number(id));
  }

  @Post(':sectorId/messages/:messageId')
  async assignMessageToSector(
    @Param('sectorId') sectorId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.sectorService.assignMessageToSector(
      Number(messageId),
      Number(sectorId),
    );
  }

  @Get(':id/messages')
  async getMessagesByDepartment(@Param('id') id: string) {
    return this.sectorService.getMessagesBySector(Number(id));
  }
}

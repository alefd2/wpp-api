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
import { DepartmentService } from './department.service';

@Controller('whatsapp/departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  async createDepartment(
    @Body('name') name: string,
    @Body('description') description?: string,
  ) {
    return this.departmentService.createDepartment(name, description);
  }

  @Get()
  async getAllDepartments() {
    return this.departmentService.getAllDepartments();
  }

  @Get(':id')
  async getDepartmentById(@Param('id') id: string) {
    return this.departmentService.getDepartmentById(Number(id));
  }

  @Put(':id')
  async updateDepartment(
    @Param('id') id: string,
    @Body('name') name: string,
    @Body('description') description?: string,
  ) {
    return this.departmentService.updateDepartment(
      Number(id),
      name,
      description,
    );
  }

  @Delete(':id')
  async deleteDepartment(@Param('id') id: string) {
    return this.departmentService.deleteDepartment(Number(id));
  }

  @Post(':departmentId/messages/:messageId')
  async assignMessageToDepartment(
    @Param('departmentId') departmentId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.departmentService.assignMessageToDepartment(
      Number(messageId),
      Number(departmentId),
    );
  }

  @Get(':id/messages')
  async getMessagesByDepartment(@Param('id') id: string) {
    return this.departmentService.getMessagesByDepartment(Number(id));
  }
}

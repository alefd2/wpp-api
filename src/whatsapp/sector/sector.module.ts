import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { SectorService } from './sector.service';
import { DepartmentController } from './sector.controller';

@Module({
  controllers: [DepartmentController],
  providers: [SectorService, PrismaService],
  exports: [SectorService],
})
export class SectorModule {}

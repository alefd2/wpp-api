import { Module } from '@nestjs/common';
import { AbilityService } from './ability.service';

@Module({
  providers: [AbilityService],
  exports: [AbilityService],
})
export class AbilityModule {}

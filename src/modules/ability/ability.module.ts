import { Module } from '@nestjs/common';
import { AbilityService } from '../../common/services/ability.service';

@Module({
  providers: [AbilityService],
  exports: [AbilityService],
})
export class AbilityModule {}

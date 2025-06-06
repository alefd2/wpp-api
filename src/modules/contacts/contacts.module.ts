import { Module } from '@nestjs/common';
import { ContactsService } from './services/contacts.service';
import { ContactsController } from './controllers/contacts.controller';
import { PrismaService } from '../../prisma.service';
import { ContactObservationService } from './services/contact-observation.service';
import { ContactObservationController } from './controllers/contact-observation.controller';
import { AbilityModule } from '../ability/ability.module';
@Module({
  imports: [AbilityModule],
  controllers: [ContactsController, ContactObservationController],
  providers: [ContactsService, PrismaService, ContactObservationService],
  exports: [ContactsService, ContactObservationService],
})
export class ContactsModule {}

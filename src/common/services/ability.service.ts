import { Injectable } from '@nestjs/common';
import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability';
import { Action } from '../enums/action.enum';
import { Resource } from '../enums/resource.enum';
import { User, DepartmentUser } from '@prisma/client';

type UserWithDepartments = User & {
  departments: DepartmentUser[];
};

type AppAbility = MongoAbility;

@Injectable()
export class AbilityService {
  createForUser(user: UserWithDepartments) {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

    if (user.role === 'admin') {
      can(Action.Manage, Resource.All);
    }

    if (user.role === 'manager') {
      can(
        [Action.Create, Action.Read, Action.Update],
        [
          Resource.User,
          Resource.Department,
          Resource.Contact,
          Resource.Ticket,
          Resource.Message,
          Resource.Channel,
          Resource.Whatsapp,
          Resource.Tag,
          Resource.QuickResponse,
          Resource.MessageTemplate,
          Resource.ContactObservation,
        ],
      );

      cannot(Action.Delete, Resource.All);
    }

    if (user.role === 'attendant') {
      can(Action.Read, [
        Resource.Department,
        Resource.Contact,
        Resource.Tag,
        Resource.QuickResponse,
        Resource.MessageTemplate,
        Resource.User,
      ]);

      can(
        [Action.Create, Action.Read, Action.Update],
        [Resource.Ticket, Resource.Message, Resource.ContactObservation],
      );

      can(
        [Action.Create, Action.Read, Action.Delete],
        Resource.ContactObservation,
      );

      cannot(Action.Create, Resource.User);
    }

    return build();
  }
}

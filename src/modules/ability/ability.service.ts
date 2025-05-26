import { Injectable } from '@nestjs/common';
import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  subject,
} from '@casl/ability';
import { Action } from '../../common/enums/action.enum';
import { Resource } from '../../common/enums/resource.enum';
import { User, DepartmentUser } from '@prisma/client';
import { UserAbilitiesDTO, AbilityDTO } from '../auth/dto/ability.dto';

type UserWithDepartments = User & {
  departments: DepartmentUser[];
};

type AppAbility = MongoAbility;

@Injectable()
export class AbilityService {
  createForUser(user: UserWithDepartments) {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

    if (user.role === 'admin') {
      // Admin tem todas as permissões em todos os recursos
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

      cannot(Action.Create, Resource.User);
      cannot(Action.Delete, Resource.All);
    }

    return build();
  }

  getUserAbilities(user: UserWithDepartments): UserAbilitiesDTO {
    const ability = this.createForUser(user);
    const rules = ability.rules;

    const abilities: AbilityDTO[] = rules.flatMap((rule) => {
      const actions = Array.isArray(rule.action) ? rule.action : [rule.action];
      const subjects = Array.isArray(rule.subject)
        ? rule.subject
        : [rule.subject];

      return actions.flatMap((action) =>
        subjects.map((subject) => ({
          action: action as Action,
          subject: subject as Resource,
        })),
      );
    });

    return { abilities };
  }
}

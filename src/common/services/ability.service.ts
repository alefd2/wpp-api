import { Injectable } from '@nestjs/common';
import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  subject,
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
        [Resource.Ticket, Resource.Message],
      );

      can(
        [Action.Create, Action.Read, Action.Delete],
        Resource.ContactObservation,
      );

      cannot(Action.Delete, Resource.All);
      cannot(Action.Create, Resource.User);
    }

    return build();
  }

  getUserAbilities(user: UserWithDepartments) {
    const ability = this.createForUser(user);
    const abilities = [];

    // Lista todos os recursos possíveis
    const resources = Object.values(Resource).filter((r) => r !== Resource.All);

    // Lista todas as ações possíveis
    const actions = Object.values(Action).filter((a) => a !== Action.Manage);

    // Para cada combinação de ação e recurso, verifica se o usuário tem permissão
    for (const resource of resources) {
      for (const action of actions) {
        if (ability.can(action, resource)) {
          abilities.push({ action, subject: resource });
        }
      }

      // Verifica se tem permissão de gerenciar (todas as ações)
      if (ability.can(Action.Manage, resource)) {
        for (const action of actions) {
          abilities.push({ action, subject: resource });
        }
      }
    }

    return { abilities };
  }
}

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

type UserWithDepartments = User & {
  departments: DepartmentUser[];
};

type AppAbility = MongoAbility;

type ActionMap = {
  [key in Action]?: boolean;
};

type AbilitiesMap = {
  [key in Resource]?: ActionMap;
};

export interface UserAbilitiesDTO {
  abilities: AbilitiesMap;
}

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
          Resource.Conversation,
          Resource.Report,
        ],
      );

      cannot(Action.Delete, Resource.All);
      cannot(Action.Manage, Resource.Financial);
    }

    if (user.role === 'attendant') {
      // Permissões concedidas
      can(Action.Read, [
        Resource.Department,
        Resource.Contact,
        Resource.Tag,
        Resource.QuickResponse,
        Resource.MessageTemplate,
        Resource.User,
        Resource.ContactObservation,
      ]);
      can(
        [Action.Create, Action.Read, Action.Update],
        [Resource.Ticket, Resource.Message, Resource.ContactObservation],
      );

      // Permissões negadas
      cannot(Action.Create, Resource.User);
      cannot(Action.Delete, Resource.All);
      cannot(Action.Update, [
        Resource.User,
        Resource.Department,
        Resource.Contact,
        Resource.Tag,
        Resource.QuickResponse,
        Resource.MessageTemplate,
      ]);
      cannot(Action.Create, [
        Resource.Department,
        Resource.Contact,
        Resource.Tag,
        Resource.QuickResponse,
        Resource.MessageTemplate,
      ]);
    }

    return build();
  }

  getUserAbilities(user: UserWithDepartments): UserAbilitiesDTO {
    const ability = this.createForUser(user);
    const rules = ability.rules;

    // Inicializa o mapa de habilidades com todos os recursos e ações como false
    const abilitiesMap: AbilitiesMap = Object.values(Resource).reduce(
      (acc, resource) => {
        if (resource === Resource.All) return acc;

        acc[resource] = {
          [Action.Create]: false,
          [Action.Read]: false,
          [Action.Update]: false,
          [Action.Delete]: false,
          [Action.Manage]: false,
        };
        return acc;
      },
      {} as AbilitiesMap,
    );

    // Processa as regras do CASL
    rules.forEach((rule) => {
      const actions = Array.isArray(rule.action) ? rule.action : [rule.action];
      const subjects = Array.isArray(rule.subject)
        ? rule.subject
        : [rule.subject];
      const isAllowed = !rule.inverted;

      // Se tem permissão de manage, concede todas as ações
      if (actions.includes(Action.Manage)) {
        subjects.forEach((subj) => {
          const subject = subj as Resource;
          if (subject === Resource.All) {
            Object.keys(abilitiesMap).forEach((resourceKey) => {
              const resource = resourceKey as Resource;
              Object.values(Action).forEach((action) => {
                if (abilitiesMap[resource]) {
                  abilitiesMap[resource][action] = isAllowed;
                }
              });
            });
          } else if (abilitiesMap[subject]) {
            Object.values(Action).forEach((action) => {
              abilitiesMap[subject][action] = isAllowed;
            });
          }
        });
        return;
      }

      // Processa permissões específicas
      actions.forEach((action) => {
        subjects.forEach((subj) => {
          const subject = subj as Resource;
          if (subject === Resource.All) {
            Object.keys(abilitiesMap).forEach((resourceKey) => {
              const resource = resourceKey as Resource;
              if (abilitiesMap[resource]) {
                abilitiesMap[resource][action] = isAllowed;
              }
            });
          } else if (abilitiesMap[subject]) {
            abilitiesMap[subject][action] = isAllowed;
          }
        });
      });
    });

    return { abilities: abilitiesMap };
  }
}

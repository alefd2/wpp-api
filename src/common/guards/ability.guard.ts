import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbilityService } from '../services/ability.service';
import {
  CHECK_ABILITY,
  RequiredRule,
} from '../decorators/check-ability.decorator';

@Injectable()
export class AbilityGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private abilityService: AbilityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rules =
      this.reflector.get<RequiredRule[]>(CHECK_ABILITY, context.getHandler()) ||
      [];

    if (rules.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const ability = this.abilityService.createForUser(user);

    const canAccess = rules.every((rule) =>
      ability.can(rule.action, rule.subject),
    );

    if (!canAccess) {
      throw new ForbiddenException(
        'Você não tem permissão para realizar esta ação',
      );
    }

    return true;
  }
}

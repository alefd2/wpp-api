import { Controller } from '@nestjs/common';
import { BaseController } from '../base/base.controller';
import { UserService } from './user.service';
import { User } from '@prisma/client';

@Controller('users')
export class UserController extends BaseController<User> {
  constructor(protected readonly userService: UserService) {
    super(userService);
  }
} 
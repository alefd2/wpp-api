import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/company.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LoginDto, AuthResponseDto, LogoutResponseDto } from './dto/auth.dto';
import { UserResponseDto } from '../user/dto/user.dto';
import {
  ApiCreate,
  ApiDetail,
} from '../../common/decorators/swagger.decorator';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiCreate({
    summary: 'Autenticar usuário',
    description: 'Autentica o usuário e retorna um token JWT',
    request: LoginDto,
    response: { type: AuthResponseDto },
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    return this.authService.login(user);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiCreate({
    summary: 'Realizar logout',
    description: 'Invalida o token JWT do usuário',
    response: { type: LogoutResponseDto },
  })
  async logout(@CurrentUser() user: any): Promise<LogoutResponseDto> {
    await this.authService.logout(user.id);
    return { message: 'Logout realizado com sucesso' };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiDetail({
    summary: 'Obter dados do usuário atual',
    description: 'Retorna os dados do usuário autenticado',
    response: { type: UserResponseDto },
  })
  async me(@CurrentUser() user: any): Promise<UserResponseDto> {
    return user;
  }
}

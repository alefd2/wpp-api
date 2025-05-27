import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/company.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { LoginDto, AuthResponseDto, LogoutResponseDto } from './dto/auth.dto';
import { UserResponseDto } from '../user/dto/user.dto';
import {
  ApiCreate,
  ApiDetail,
} from '../../common/decorators/swagger.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AbilityService } from '../ability/ability.service';
import { PrismaService } from '../../prisma.service';
import { UserAbilitiesDTO } from './dto/ability.dto';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private abilityService: AbilityService,
    private prisma: PrismaService,
  ) {}

  @Public()
  @Post('login')
  @ApiCreate({
    summary: 'Autenticar usuário',
    description: 'Autentica o usuário e retorna um token JWT',
    request: LoginDto,
    response: { type: AuthResponseDto },
  })
  @ApiOperation({ summary: 'Login do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Retorna o token de acesso',
  })
  async login(@Body() loginDto: LoginDto, @Request() req) {
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

  @UseGuards(JwtAuthGuard)
  @Get('abilities')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna as permissões do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Lista de permissões do usuário',
    type: UserAbilitiesDTO,
  })
  async getAbilities(@Request() req) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        departments: true,
      },
    });
    return this.abilityService.getUserAbilities(user);
  }
}

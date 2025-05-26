import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
        departments: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      companyId: user.companyId,
      role: user.role,
    };

    // Criar sessão
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: this.jwtService.sign(payload),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      },
    });

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async logout(userId: number) {
    await this.prisma.session.deleteMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }
}

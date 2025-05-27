import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { WhatsappAuthDto } from '../dto/whatsapp-auth.dto';
import { CreateChannelDto } from '../channel/dto/create-channel.dto';
import { ChannelType } from '../enums/channel-type.enum';
import axios from 'axios';

@Injectable()
export class WhatsappAuthService {
  private readonly logger = new Logger(WhatsappAuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async authenticate(auth: WhatsappAuthDto, companyId: number) {
    try {
      const existingCredential = await this.prisma.whatsappCredential.findFirst(
        {
          where: {
            companyId,
            active: true,
          },
        },
      );

      // Obter token de acesso do Facebook
      const fbResponse = await axios.get(
        `https://graph.facebook.com/v19.0/oauth/access_token`,
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: auth.clientId,
            client_secret: auth.clientSecret,
            fb_exchange_token: auth.fbExchangeToken,
          },
        },
      );

      const { access_token, token_type, expires_in } = fbResponse.data;
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      // Se existir uma credencial ativa, desativara
      if (existingCredential) {
        await this.prisma.whatsappCredential.update({
          where: { id: existingCredential.id },
          data: { active: false },
        });
      }
      // Criar credencial nova
      const newCredential = await this.prisma.whatsappCredential.create({
        data: {
          companyId,
          clientId: auth.clientId,
          clientSecret: auth.clientSecret,
          fbExchangeToken: auth.fbExchangeToken,
          accessToken: access_token,
          tokenType: token_type,
          expiresIn: expires_in,
          expiresAt,
          active: true,
        },
      });

      return {
        success: true,
        credential: {
          id: newCredential.id,
          expiresAt: newCredential.expiresAt,
        },
      };
    } catch (error) {
      this.logger.error('Authentication failed:', error);
      throw new UnauthorizedException('Invalid Meta credentials');
    }
  }

  /* não é usado */
  async getCompanyCredentials(companyId: number) {
    const credential = await this.prisma.whatsappCredential.findFirst({
      where: {
        companyId,
        active: true,
      },
    });

    if (!credential) {
      throw new UnauthorizedException('Company credentials not found');
    }

    // Verificar se o token está próximo de expirar (7 dias)
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (credential.expiresAt && credential.expiresAt < sevenDaysFromNow) {
      this.logger.warn(
        `WhatsApp credential for company ${companyId} will expire soon on ${credential.expiresAt}`,
      );
    }

    return credential;
  }

  async updateCredentials(
    id: number,
    auth: WhatsappAuthDto,
    companyId: number,
  ) {
    try {
      // Verificar se a credencial existe e pertence à empresa
      const credential = await this.prisma.whatsappCredential.findFirst({
        where: {
          id,
          companyId,
          active: true,
        },
      });

      if (!credential) {
        throw new UnauthorizedException('Credential not found or not active');
      }

      // Obter novo token de acesso do Facebook
      const fbResponse = await axios.get(
        `https://graph.facebook.com/v19.0/oauth/access_token`,
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: auth.clientId,
            client_secret: auth.clientSecret,
            fb_exchange_token: auth.fbExchangeToken,
          },
        },
      );

      const { access_token, token_type, expires_in } = fbResponse.data;
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      // Desativar credencial atual
      await this.prisma.whatsappCredential.update({
        where: { id },
        data: { active: false },
      });

      // Criar nova credencial
      const newCredential = await this.prisma.whatsappCredential.create({
        data: {
          companyId,
          clientId: auth.clientId,
          clientSecret: auth.clientSecret,
          fbExchangeToken: auth.fbExchangeToken,
          accessToken: access_token,
          tokenType: token_type,
          expiresIn: expires_in,
          expiresAt,
          active: true,
        },
      });

      return {
        success: true,
        credential: {
          id: newCredential.id,
          expiresAt: newCredential.expiresAt,
        },
      };
    } catch (error) {
      this.logger.error('Error updating credentials:', error);
      throw new UnauthorizedException('Failed to update credentials');
    }
  }

  async getCredentialsHistory(companyId: number) {
    const credentials = await this.prisma.whatsappCredential.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        active: true,
        createdAt: true,
        expiresAt: true,
        clientId: true,
      },
    });

    return credentials;
  }
}

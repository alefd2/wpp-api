import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { WhatsappStatus } from '../enums/whatsapp-status.enum';
import { ChannelProvider } from './channel-factory.service';

@Injectable()
export class WhatsappApiService implements ChannelProvider {
  private readonly logger = new Logger(WhatsappApiService.name);
  private readonly api: AxiosInstance;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!this.phoneNumberId || !this.accessToken) {
      throw new Error('WhatsApp API configuration is missing');
    }

    this.api = axios.create({
      baseURL: `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_VERSION}`,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para log de erros
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error('WhatsApp API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
          },
        });
        throw error;
      },
    );
  }

  async connect(): Promise<any> {
    try {
      const response = await this.checkPhoneNumber();
      return response;
    } catch (error) {
      this.logger.error(
        'Error connecting:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async disconnect(): Promise<any> {
    return {
      status: WhatsappStatus.DISCONNECTED,
    };
  }

  async getStatus(): Promise<any> {
    return this.checkPhoneNumber();
  }

  async verifyToken(token: string): Promise<boolean> {
    return token === process.env.WHATSAPP_VERIFY_TOKEN;
  }

  async getBusinessProfile(): Promise<any> {
    try {
      const response = await this.api.get(
        `/${this.phoneNumberId}/whatsapp_business_profile`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Error getting business profile:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async registerWebhook(url: string): Promise<any> {
    try {
      // Primeiro, registra o app para receber notificações
      const subscribeResponse = await this.api.post(
        `/${this.phoneNumberId}/subscribed_apps`,
        {
          access_token: this.accessToken,
        },
      );

      // Depois, configura os campos que queremos receber
      const updateResponse = await this.api.post(
        '/app/webhooks/setup',
        {
          object: 'whatsapp_business_account',
          callback_url: url,
          fields: [
            'messages', // Mensagens recebidas
            'status', // Status das mensagens (sent, delivered, read)
            'conversation', // Atualizações de conversas (inclui status de leitura)
            'message_template_status_update', // Status de templates
          ],
          include_values: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log('Webhook configurado com sucesso:', {
        subscribeResponse: subscribeResponse.data,
        updateResponse: updateResponse.data,
      });

      return {
        success: true,
        subscribe: subscribeResponse.data,
        update: updateResponse.data,
      };
    } catch (error) {
      this.logger.error(
        'Error registering webhook:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async checkPhoneNumber(): Promise<any> {
    try {
      const response = await this.api.get(`/${this.phoneNumberId}`);
      return {
        status: WhatsappStatus.CONNECTED,
        data: response.data,
      };
    } catch (error) {
      this.logger.error(
        'Error checking phone number:',
        error.response?.data || error.message,
      );
      return {
        status: WhatsappStatus.ERROR,
        error: error.response?.data || error.message,
      };
    }
  }

  async updatePhoneNumber(name: string): Promise<any> {
    try {
      const response = await this.api.post(`/${this.phoneNumberId}`, {
        messaging_product: 'whatsapp',
        pin: process.env.WHATSAPP_APP_SECRET,
        display_name: name,
      });
      return response.data;
    } catch (error) {
      this.logger.error(
        'Error updating phone number:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async deregisterPhone(): Promise<any> {
    try {
      const response = await this.api.delete(
        `/${this.phoneNumberId}/deregister`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Error deregistering phone:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async sendMessage(message: any): Promise<any> {
    try {
      // Validação básica da mensagem
      if (!message.to || !message.type) {
        throw new BadRequestException('Invalid message format');
      }

      // Envio para a API do WhatsApp
      const response = await this.api.post(
        `/${this.phoneNumberId}/messages`,
        message,
      );

      // Log de sucesso
      this.logger.log('Message sent successfully:', {
        to: message.to,
        type: message.type,
        messageId: response.data.messages?.[0]?.id,
      });

      return response.data;
    } catch (error) {
      // Tratamento específico de erros da API
      if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        throw new BadRequestException({
          code: apiError.code,
          message: apiError.message,
          details: apiError.error_data,
        });
      }

      // Re-throw do erro original
      throw error;
    }
  }

  async getMessageStatus(messageId: string): Promise<any> {
    try {
      const response = await this.api.get(
        `/${this.phoneNumberId}/messages/${messageId}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error getting message status for ${messageId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async downloadMedia(mediaId: string): Promise<any> {
    try {
      const response = await this.api.get(
        `/${this.phoneNumberId}/media/${mediaId}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error downloading media ${mediaId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  }
}

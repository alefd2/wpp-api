import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { WhatsappApiService } from './whatsapp-api.service';
import { SendMessageDto, MessageType } from '../dto/send-message.dto';
import { PrismaService } from '../../../prisma.service';
import { Message } from '@prisma/client';

@Injectable()
export class WhatsappMessageService {
  private readonly logger = new Logger(WhatsappMessageService.name);

  constructor(
    private readonly whatsappApi: WhatsappApiService,
    private readonly prisma: PrismaService,
  ) {}

  async sendMessage(channelId: number, data: SendMessageDto) {
    try {
      // Validar dados específicos por tipo de mensagem
      this.validateMessageData(data);

      // Construir a mensagem para a API do WhatsApp
      const message = this.buildMessage(data);

      // Enviar a mensagem
      const response = await this.whatsappApi.sendMessage(message);

      // Extrair o ID da mensagem da resposta
      const messageId = response.messages[0].id;

      // Salvar a mensagem no banco de dados
      const savedMessage = await this.prisma.message.create({
        data: {
          messageId,
          channelId,
          from: data.to, // No caso de mensagem enviada, o "from" é o destinatário
          type: data.type,
          content: this.getMessageContent(data),
          timestamp: new Date(),
          status: 'SENT',
          direction: 'OUTBOUND',
        },
      });

      // Log de sucesso
      this.logger.log(
        `Mensagem ${messageId} enviada com sucesso para ${data.to}`,
      );

      return {
        message: savedMessage,
        whatsapp: response,
      };
    } catch (error) {
      // Log detalhado do erro
      this.logger.error('Erro ao enviar mensagem:', {
        error: error.response?.data || error.message,
        data,
        channelId,
      });

      // Re-throw com mensagem amigável
      throw new BadRequestException(
        error.response?.data?.error?.message ||
          'Erro ao enviar mensagem. Por favor, tente novamente.',
      );
    }
  }

  async updateMessageStatus(messageId: string, status: string) {
    try {
      // Primeiro encontra a mensagem pelo messageId
      const message = await this.prisma.message.findFirst({
        where: { messageId },
      });

      if (!message) {
        throw new NotFoundException(`Mensagem ${messageId} não encontrada`);
      }

      // Atualiza o status da mensagem
      const updatedMessage = await this.prisma.message.update({
        where: { id: message.id },
        data: { status },
      });

      this.logger.log(
        `Status da mensagem ${messageId} atualizado para ${status}`,
      );

      return updatedMessage;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar status da mensagem ${messageId}:`,
        error,
      );
      throw error;
    }
  }

  private validateMessageData(data: SendMessageDto) {
    switch (data.type) {
      case MessageType.TEXT:
        if (!data.text) {
          throw new BadRequestException('Text is required for text messages');
        }
        break;

      case MessageType.IMAGE:
      case MessageType.AUDIO:
      case MessageType.VIDEO:
        if (!data.mediaUrl) {
          throw new BadRequestException(
            `Media URL is required for ${data.type} messages`,
          );
        }
        break;

      case MessageType.DOCUMENT:
        if (!data.mediaUrl || !data.filename) {
          throw new BadRequestException(
            'Media URL and filename are required for document messages',
          );
        }
        break;
    }
  }

  private buildMessage(data: SendMessageDto) {
    const base = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: data.to,
      type: data.type,
    };

    switch (data.type) {
      case MessageType.TEXT:
        return {
          ...base,
          text: {
            body: data.text,
          },
        };

      case MessageType.IMAGE:
        return {
          ...base,
          image: {
            link: data.mediaUrl,
            caption: data.caption,
          },
        };

      case MessageType.DOCUMENT:
        return {
          ...base,
          document: {
            link: data.mediaUrl,
            caption: data.caption,
            filename: data.filename,
          },
        };

      case MessageType.AUDIO:
        return {
          ...base,
          audio: {
            link: data.mediaUrl,
          },
        };

      case MessageType.VIDEO:
        return {
          ...base,
          video: {
            link: data.mediaUrl,
            caption: data.caption,
          },
        };

      default:
        throw new BadRequestException(`Unsupported message type: ${data.type}`);
    }
  }

  private getMessageContent(data: SendMessageDto): string {
    switch (data.type) {
      case MessageType.TEXT:
        return data.text;

      case MessageType.IMAGE:
      case MessageType.VIDEO:
        return JSON.stringify({
          url: data.mediaUrl,
          caption: data.caption,
        });

      case MessageType.DOCUMENT:
        return JSON.stringify({
          url: data.mediaUrl,
          filename: data.filename,
          caption: data.caption,
        });

      case MessageType.AUDIO:
        return JSON.stringify({
          url: data.mediaUrl,
        });

      default:
        return JSON.stringify(data);
    }
  }

  async processInboundMessage(message: any, channelId: number) {
    try {
      const content = message.text?.body || JSON.stringify(message);

      // Primeiro salva a mensagem como RECEIVED
      const savedMessage = await this.prisma.message.create({
        data: {
          messageId: message.id,
          channelId,
          from: message.from,
          type: message.type,
          content,
          timestamp: new Date(parseInt(message.timestamp) * 1000),
          status: 'RECEIVED',
          direction: 'INBOUND',
        },
      });

      this.logger.log(
        `Mensagem ${message.id} recebida e salva com status RECEIVED`,
      );

      // Após um breve delay, atualiza para READ
      setTimeout(async () => {
        try {
          await this.prisma.message.update({
            where: { id: savedMessage.id },
            data: {
              status: 'READ',
              timestamp: new Date(), // Atualiza o timestamp para quando foi lida
            },
          });
          this.logger.log(`Mensagem ${message.id} atualizada para status READ`);
        } catch (error) {
          this.logger.error(
            `Erro ao atualizar status para READ: ${message.id}`,
            error,
          );
        }
      }, 2000); // Delay de 2 segundos para simular o tempo de leitura

      return savedMessage;
    } catch (error) {
      this.logger.error(`Failed to process inbound message: ${error.message}`);
      throw error;
    }
  }
}

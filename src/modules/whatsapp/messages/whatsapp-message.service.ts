import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { WhatsappApiService } from '../services/whatsapp-api.service';
import { SendMessageDto, MessageType } from './dto/send-message.dto';
import { PrismaService } from '../../../prisma.service';
import { MessageService } from './message.service';

@Injectable()
export class WhatsappMessageService {
  private readonly logger = new Logger(WhatsappMessageService.name);

  constructor(
    private readonly whatsappApi: WhatsappApiService,
    private readonly prisma: PrismaService,
    private readonly messageService: MessageService,
  ) {}

  private async validateTicket(ticketId: number, channelId: number) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        contact: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket não encontrado');
    }

    if (!ticket.active || ticket.status !== 'ACTIVE') {
      throw new ConflictException('Ticket não está ativo');
    }

    if (ticket.channelId !== channelId) {
      throw new ConflictException('Ticket não pertence a este canal');
    }

    return ticket;
  }

  private formatPhoneNumber(phone: string): string {
    const numbers = phone.replace(/\D/g, '');

    const withCountry = numbers.startsWith('55') ? numbers : `55${numbers}`;

    const ddd = withCountry.substring(2, 4);
    const rest = withCountry.substring(4);

    // Se o resto tiver 8 dígitos, adiciona o 9
    if (rest.length === 8) {
      return `55${ddd}9${rest}`;
    }

    // Se já tiver 9 dígitos (com o 9), retorna como está
    if (rest.length === 9 && rest.startsWith('9')) {
      return `55${ddd}${rest}`;
    }

    // Para outros casos, retorna o número original formatado
    return withCountry;
  }

  private async findActiveTicketByPhone(phone: string, channelId: number) {
    const formattedPhone = this.formatPhoneNumber(phone);

    // Busca o ticket ativo para este número de telefone
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        channelId,
        active: true,
        status: 'ACTIVE',
        contact: {
          phone: formattedPhone,
        },
      },
      include: {
        contact: true,
      },
      orderBy: {
        createdAt: 'desc', // Pega o ticket mais recente se houver mais de um
      },
    });

    if (!ticket) {
      throw new NotFoundException(
        `Nenhum ticket ativo encontrado para o número ${phone}`,
      );
    }

    this.logger.log(
      `Ticket ativo encontrado: #${ticket.id} para o número ${phone}`,
    );
    return ticket;
  }

  async sendMessage(channelId: number, data: SendMessageDto) {
    try {
      // Encontra o ticket ativo para este número
      const ticket = await this.findActiveTicketByPhone(data.to, channelId);

      // Valida os dados da mensagem
      this.validateMessageData(data);

      const message = this.buildMessage(data);

      const response = await this.whatsappApi.sendMessage(message);

      const messageId = response.messages[0].id;

      const savedMessage = await this.prisma.message.create({
        data: {
          messageId,
          channelId,
          ticketId: ticket.id, // Usa o ticket encontrado
          from: data.to,
          type: data.type,
          category: 'CHAT',
          origin: 'USER',
          content: this.getMessageContent(data),
          timestamp: new Date(),
          status: 'SENT',
          direction: 'OUTBOUND',
        },
      });

      this.logger.log(
        `Mensagem ${messageId} enviada com sucesso para ${data.to} (Ticket #${ticket.id})`,
      );

      return {
        message: savedMessage,
        whatsapp: response,
        ticket: {
          id: ticket.id,
          protocol: ticket.protocol,
        },
      };
    } catch (error) {
      // Log detalhado do erro
      this.logger.error('Erro ao enviar mensagem:', {
        error: error.response?.data || error.message,
        data,
        channelId,
      });

      throw error;
    }
  }

  async updateMessageStatus(messageId: string, status: string) {
    try {
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
      const formattedPhone = this.formatPhoneNumber(message.from);

      this.logger.log(
        `Número original: ${message.from}, Formatado: ${formattedPhone}`,
      );

      // Primeiro salva a mensagem como RECEIVED
      const savedMessage = await this.prisma.message.create({
        data: {
          messageId: message.id,
          channelId,
          from: formattedPhone,
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

      // Processa a mensagem para criar/atualizar contato e ticket
      await this.messageService.handleNewMessage(savedMessage);

      return savedMessage;
    } catch (error) {
      this.logger.error(`Failed to process inbound message: ${error.message}`);
      throw error;
    }
  }
}

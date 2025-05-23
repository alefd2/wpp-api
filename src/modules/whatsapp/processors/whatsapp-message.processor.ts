import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../../prisma.service';
import { WhatsappWebhookDto } from '../interfaces/webhook.interface';

@Processor('whatsapp-messages')
export class WhatsappMessageProcessor {
  private readonly logger = new Logger(WhatsappMessageProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('process-message')
  async processMessage(
    job: Job<{ message: any; metadata: any; companyId: number }>,
  ) {
    try {
      const { message, metadata, companyId } = job.data;
      this.logger.debug('Dados recebidos:', { message, metadata, companyId });

      // Validação dos dados da mensagem
      if (!message?.from || !message?.id || !metadata?.businessPhoneNumber) {
        this.logger.error('Dados incompletos:', { message, metadata });
        throw new Error('Dados da mensagem incompletos');
      }

      // Encontrar ou criar o contato
      const contact = await this.findOrCreateContact(
        message.from,
        companyId,
        message.contact,
      );
      this.logger.debug('Contato processado:', contact);

      // Encontrar o canal pelo número do WhatsApp
      const channel = await this.prisma.channel.findFirst({
        where: {
          fbNumberPhoneId: metadata.businessPhoneNumber,
          type: 'WHATSAPP_CLOUD',
          active: true,
          companyId,
        },
        include: {
          company: true,
        },
      });

      if (!channel) {
        throw new Error(
          `Canal não encontrado para o número ${metadata.businessPhoneNumber} na empresa ${companyId}`,
        );
      }

      // Extrair o conteúdo da mensagem
      const content = this.extractMessageContent(message);

      // Salvar a mensagem
      const savedMessage = await this.prisma.message.create({
        data: {
          messageId: message.id,
          channelId: channel.id,
          from: message.from,
          type: message.type || 'text',
          content,
          timestamp: new Date(parseInt(message.timestamp) * 1000),
          status: 'RECEIVED',
          direction: 'INBOUND',
        },
      });

      this.logger.log(
        `Mensagem ${message.id} processada com sucesso para empresa ${companyId}`,
      );
      return {
        success: true,
        messageId: message.id,
        savedMessageId: savedMessage.id,
      };
    } catch (error) {
      this.logger.error(`Erro ao processar mensagem da fila:`, error);
      throw error;
    }
  }

  private async findOrCreateContact(
    phone: string,
    companyId: number,
    contactInfo?: any,
  ) {
    try {
      this.logger.debug('Buscando contato:', { phone, companyId, contactInfo });

      // Buscar contato existente
      const existingContact = await this.prisma.contact.findFirst({
        where: {
          phone,
          companyId,
        },
      });

      if (existingContact) {
        // Atualizar informações do contato se necessário
        if (
          contactInfo?.profile?.name &&
          existingContact.name !== contactInfo.profile.name
        ) {
          return await this.prisma.contact.update({
            where: { id: existingContact.id },
            data: {
              name: contactInfo.profile.name,
              updatedAt: new Date(),
            },
          });
        }
        return existingContact;
      }

      // Criar novo contato
      const newContact = await this.prisma.contact.create({
        data: {
          name: contactInfo?.profile?.name || `WhatsApp ${phone}`,
          phone,
          companyId,
          active: true,
        },
      });

      this.logger.debug('Novo contato criado:', newContact);
      return newContact;
    } catch (error) {
      this.logger.error(`Erro ao processar contato ${phone}:`, error);
      throw error;
    }
  }

  private extractMessageContent(message: any): string {
    try {
      switch (message.type) {
        case 'text':
          return message.text?.body || '';

        case 'image':
          return JSON.stringify({
            id: message.image?.id,
            mime_type: message.image?.mime_type,
            caption: message.image?.caption,
          });

        case 'document':
          return JSON.stringify({
            id: message.document?.id,
            filename: message.document?.filename,
            mime_type: message.document?.mime_type,
            caption: message.document?.caption,
          });

        case 'audio':
          return JSON.stringify({
            id: message.audio?.id,
            mime_type: message.audio?.mime_type,
            voice: message.audio?.voice,
          });

        case 'video':
          return JSON.stringify({
            id: message.video?.id,
            mime_type: message.video?.mime_type,
            caption: message.video?.caption,
          });

        default:
          return JSON.stringify(message);
      }
    } catch (error) {
      this.logger.error(
        `Erro ao extrair conteúdo da mensagem ${message?.id}:`,
        error,
      );
      return JSON.stringify(message);
    }
  }
}

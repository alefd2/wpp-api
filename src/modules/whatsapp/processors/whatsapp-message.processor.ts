import { Process, Processor, OnQueueError } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { WhatsappMessageService } from '../messages/whatsapp-message.service';
import { MessageService } from '../messages/message.service';

@Processor('whatsapp-messages')
export class WhatsappMessageProcessor {
  private readonly logger = new Logger(WhatsappMessageProcessor.name);

  constructor(
    private readonly whatsappMessageService: WhatsappMessageService,
    private readonly messageService: MessageService,
  ) {}

  @Process('receive')
  async handleReceiveMessage(
    job: Job<{ message: any; channelId: number; metadata: any }>,
  ) {
    try {
      this.logger.log(
        `[PROCESSOR] Iniciando processamento de mensagem - Job ${job.id}`,
        {
          jobId: job.id,
          messageId: job.data.message.id,
          channelId: job.data.channelId,
          type: job.data.message.type,
        },
      );

      const { message, channelId, metadata } = job.data;

      // Processa a mensagem recebida
      const savedMessage =
        await this.whatsappMessageService.processInboundMessage(
          message,
          channelId,
        );

      this.logger.log(
        `[PROCESSOR] Mensagem salva com sucesso - Job ${job.id}`,
        {
          jobId: job.id,
          messageId: message.id,
          savedMessageId: savedMessage.id,
        },
      );

      // Processa nova mensagem (criação de ticket, etc)
      await this.messageService.handleNewMessage(savedMessage);

      this.logger.log(`[PROCESSOR] Processamento concluído - Job ${job.id}`, {
        jobId: job.id,
        messageId: message.id,
        status: 'success',
      });

      return { success: true, messageId: message.id };
    } catch (error) {
      this.logger.error(
        `[PROCESSOR] Erro ao processar mensagem - Job ${job.id}`,
        {
          jobId: job.id,
          messageId: job.data.message.id,
          error: error.message,
          stack: error.stack,
        },
      );
      throw error;
    }
  }

  @Process('status')
  async handleStatusUpdate(
    job: Job<{
      messageId: string;
      status: string;
      timestamp: string;
      recipientId: string;
    }>,
  ) {
    try {
      this.logger.log(
        `[PROCESSOR] Iniciando atualização de status - Job ${job.id}`,
        {
          jobId: job.id,
          messageId: job.data.messageId,
          status: job.data.status,
        },
      );

      const { messageId, status } = job.data;

      // Mapeia o status do WhatsApp para nosso formato
      const mappedStatus = this.mapWhatsAppStatus(status);

      // Atualiza o status da mensagem
      await this.whatsappMessageService.updateMessageStatus(
        messageId,
        mappedStatus,
      );

      this.logger.log(
        `[PROCESSOR] Status atualizado com sucesso - Job ${job.id}`,
        {
          jobId: job.id,
          messageId,
          oldStatus: status,
          newStatus: mappedStatus,
        },
      );

      return { success: true, messageId, status: mappedStatus };
    } catch (error) {
      this.logger.error(
        `[PROCESSOR] Erro ao atualizar status - Job ${job.id}`,
        {
          jobId: job.id,
          messageId: job.data.messageId,
          error: error.message,
          stack: error.stack,
        },
      );
      throw error;
    }
  }

  @OnQueueError()
  onError(error: Error, job?: Job) {
    const jobId = job ? job.id : 'unknown';
    this.logger.error(`[PROCESSOR] Erro na fila de mensagens - Job ${jobId}`, {
      jobId,
      error: error.message,
      stack: error.stack,
    });
  }

  private mapWhatsAppStatus(whatsappStatus: string): string {
    switch (whatsappStatus.toLowerCase()) {
      case 'sent':
        return 'SENT';
      case 'delivered':
        return 'DELIVERED';
      case 'read':
        return 'READ';
      case 'failed':
        return 'FAILED';
      default:
        return 'PENDING';
    }
  }
}

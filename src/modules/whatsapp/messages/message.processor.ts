import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MessageService } from './message.service';
import { WhatsappMessageService } from './whatsapp-message.service';

@Processor('messages')
export class MessageProcessor {
  private readonly logger = new Logger(MessageProcessor.name);

  constructor(
    private readonly messageService: MessageService,
    private readonly whatsappMessageService: WhatsappMessageService,
  ) {}

  @Process('send')
  async handleSendMessage(job: Job) {
    this.logger.debug(`Processing send message job ${job.id}`);
    const { channelId, data } = job.data;
    return await this.whatsappMessageService.sendMessage(channelId, data);
  }

  @Process('receive')
  async handleReceiveMessage(job: Job) {
    this.logger.debug(`Processing receive message job ${job.id}`);
    const { message, channelId } = job.data;
    return await this.whatsappMessageService.processInboundMessage(
      message,
      channelId,
    );
  }

  @Process('status')
  async handleStatusUpdate(job: Job) {
    this.logger.debug(`Processing status update job ${job.id}`);
    const { messageId, status } = job.data;
    return await this.whatsappMessageService.updateMessageStatus(
      messageId,
      status,
    );
  }

  @Process('mark-read')
  async handleMarkAsRead(job: Job) {
    this.logger.debug(`Processing mark as read job ${job.id}`);
    const { channelId, phone } = job.data;
    return await this.messageService.markMessagesAsRead(channelId, phone);
  }

  @Process('handle-new')
  async handleNewMessage(job: Job) {
    this.logger.debug(`Processing new message job ${job.id}`);
    const { message } = job.data;
    return await this.messageService.handleNewMessage(message);
  }
}

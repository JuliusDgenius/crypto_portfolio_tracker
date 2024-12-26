// libs/common/src/email/queue/processors/email.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService } from '../../services/email.service';
import { EMAIL_QUEUE } from '../../constants/email.constants';
import { EmailOptions } from '../../interfaces';

@Processor(EMAIL_QUEUE)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<EmailOptions>) {
    this.logger.debug(`Processing email job ${job.id}`);
    
    try {
      await this.emailService.sendMail(job.data);
      this.logger.debug(`Successfully processed email job ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed to process email job ${job.id}`, error);
      throw error;
    }
  }
}
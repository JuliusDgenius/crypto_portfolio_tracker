// libs/common/src/email/queue/email-queue.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { EmailOptions } from '../interfaces/email-options.interface';
import { EMAIL_QUEUE, EmailPriority } from '../constants/email.constants';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue,
  ) {}

  async addToQueue(options: EmailOptions): Promise<void> {
    try {
      const job = await this.emailQueue.add(
        'send-email',
        options,
        {
          priority: options.priority || EmailPriority.NORMAL,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
        },
      );

      this.logger.debug(`Added email job ${job.id} to queue`);
    } catch (error) {
      this.logger.error('Failed to add email to queue', error);
      throw error;
    }
  }

  async getQueueStatus() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
    };
  }
}
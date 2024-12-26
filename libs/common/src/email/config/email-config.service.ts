import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailConfig } from './email-config.interface';
import { join } from 'path';

@Injectable()
export class EmailConfigService {
  constructor(private configService: ConfigService) {}

  getConfig(): EmailConfig {
    const isDevelopment = this.configService.get('NODE_ENV') !== 'production';

    return {
      enabled: this.configService.get('EMAIL_ENABLED', true),
      development: isDevelopment,
      smtp: {
        host: this.configService.get('SMTP_HOST', isDevelopment ? 'localhost' : ''),
        port: this.configService.get('SMTP_PORT', isDevelopment ? 1025 : 587),
        secure: this.configService.get('SMTP_SECURE', !isDevelopment),
        auth: {
          user: this.configService.get('SMTP_USER', ''),
          pass: this.configService.get('SMTP_PASS', ''),
        },
      },
      defaults: {
        from: this.configService.get('EMAIL_FROM', 'noreply@cryptoportfoliotracker.com'),
        replyTo: this.configService.get('EMAIL_REPLY_TO', 'support@cryptoportfoliotracker.com'),
      },
      queue: {
        enabled: this.configService.get('EMAIL_QUEUE_ENABLED', !isDevelopment),
        prefix: 'email',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      },
      rateLimiting: {
        points: this.configService.get('EMAIL_RATE_LIMIT_POINTS', 100),
        duration: this.configService.get('EMAIL_RATE_LIMIT_DURATION', 3600),
      },
      templates: {
        directory: join(process.cwd(), 'libs/common/src/email/templates'),
        caching: !isDevelopment,
      },
    };
  }
}

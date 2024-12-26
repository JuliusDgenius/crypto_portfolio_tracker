// libs/common/src/email/services/email-development.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { join } from 'path';
import * as fs from 'fs/promises';
import { EmailOptions } from '../interfaces/email-options.interface';

@Injectable()
export class EmailDevelopmentService {
  private readonly logger = new Logger(EmailDevelopmentService.name);
  private readonly devEmailDir = join(process.cwd(), 'tmp', 'emails');

  constructor() {
    this.ensureDevEmailDir();
  }

  private async ensureDevEmailDir() {
    try {
      await fs.mkdir(this.devEmailDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create development email directory', error);
    }
  }

  async createDevTransport() {
    if (process.env.USE_MAILHOG === 'true') {
      // Use MailHog for local SMTP testing
      return createTransport({
        host: 'localhost',
        port: 1025,
        ignoreTLS: true,
      });
    }

    // Otherwise, use file transport
    return createTransport({
      streamTransport: true,
      buffer: true,
    });
  }

  async saveEmailToFile(options: EmailOptions, content: string | Buffer) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}-${options.template}.html`;
    const filepath = join(this.devEmailDir, filename);

    try {
      await fs.writeFile(filepath, content);
      this.logger.debug(`Development email saved to: ${filepath}`);
      
      // Log email details for development
      this.logger.debug('Email Details:', {
        to: options.to,
        subject: options.subject,
        template: options.template,
        filepath,
      });
    } catch (error) {
      this.logger.error('Failed to save development email', error);
    }
  }
}
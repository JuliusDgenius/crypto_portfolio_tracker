import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailTemplateService } from './email-template.service';
import { SentMessageInfo } from 'nodemailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  context?: Record<string, any>;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly templateService: EmailTemplateService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: this.configService.get<boolean>('EMAIL_SECURE', true),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  async onModuleInit() {
    try {
      await this.transporter.verify();
      this.logger.log('Email service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize email service', error);
      throw error;
    }
  }

  async sendEmail(options: EmailOptions): Promise<SentMessageInfo> {
    try {
      let html = options.html;
      let text = options.text;

      if (options.template) {
        html = await this.templateService.renderTemplate(
          options.template,
          options.context || {},
        );
      }

      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM'),
        to: options.to,
        subject: options.subject,
        text,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.debug(`Email sent successfully to ${options.to}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.configService.get<string>('APP_URL')}/verify-email?token=${token}`;
    
    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      template: 'verification',
      context: {
        verificationUrl,
        supportEmail: this.configService.get<string>('SUPPORT_EMAIL'),
      },
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get<string>('APP_URL')}/reset-password?token=${token}`;
    
    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      template: 'password-reset',
      context: {
        resetUrl,
        supportEmail: this.configService.get<string>('SUPPORT_EMAIL'),
      },
    });
  }

  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to Crypto Portfolio Tracker',
      template: 'welcome',
      context: {
        username,
        supportEmail: this.configService.get<string>('SUPPORT_EMAIL'),
      },
    });
  }
}

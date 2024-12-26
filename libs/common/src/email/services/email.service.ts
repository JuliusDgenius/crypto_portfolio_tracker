import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SentMessageInfo } from 'nodemailer';
import { EmailTemplateService } from './email-template.service';
import { EmailConfig, MockEmailConfig } from '../../email/config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private initialized = false;
  private emailConfig: EmailConfig;
  private mockEmailConfig: MockEmailConfig;

  constructor(
    private readonly emailTemplateService: EmailTemplateService,
    private readonly configService: ConfigService,
  ) {}

  private validateAndInitializeConfig(): void {
    // Check if email service is enabled
    const emailEnabled = this.configService.get<boolean>('EMAIL_ENABLED', false);

    if (!emailEnabled) {
      this.logger.log('Email service is disabled. Using mock configuration.');
      this.mockEmailConfig = {
        host: 'mock',
        port: 0,
        secure: false,
        mock: true,
        auth: {
          user: 'mock',
          pass: 'mock',
        },
      };
      return;
    }

    // For enabled email service, validate all required configurations
    const requiredConfig: EmailConfig = {
      enabled: emailEnabled,
      development: this.configService.get<boolean>('EMAIL_DEVELOPMENT', false),
      logger: this.logger,
  smtp: {
    host: this.configService.get<string>('EMAIL_HOST', 'smtp.example.com'),
    port: this.configService.get<number>('EMAIL_PORT', 587),
    secure: this.configService.get<boolean>('EMAIL_SECURE', false),
    auth: {
      user: this.configService.get<string>('EMAIL_USER', 'username'),
      pass: this.configService.get<string>('EMAIL_PASS', 'password'),
    }
  },
  defaults: {
    from: 'Crypto Portfolio Tracker',
    replyTo: 'support@cryptoportfoliotracker.com'
  },

  queue: {
    enabled: this.configService.get<boolean>('EMAIL_QUEUE_ENABLED', false),
    prefix: 'email',
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      }
    }
  },
  rateLimiting: {
    points: 5,
    duration: 60
  },
  templates: {
    directory: 'templates',
    caching: true
  }
    };

    // Validate all required fields are present
    const missingFields = Object.entries(requiredConfig)
      .filter(([key, value]) => {
        if (key === 'auth') {
          return !value.user || !value.pass;
        }
        return !value;
      })
      .map(([key]) => key);

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required email configuration fields: ${missingFields.join(', ')}`,
      );
    }

    // Set the email configuration with all validated values
    this.emailConfig = {
      ...requiredConfig,
      debug: this.configService.get<boolean>('EMAIL_DEBUG', false),
    };
  }

  async onModuleInit() {
    try {
      // Initialize configuration first
      this.validateAndInitializeConfig();
      await this.initializeTransporter();
      this.logger.log('Email service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize email service', error);
      this.initialized = false;
    }
  }

  private async initializeTransporter() {
    if (!this.emailConfig) {
      throw new Error('Email configuration not initialized');
    }

    try {
      if (this.mockEmailConfig.mock) {
        this.logger.log('Initializing mock email transport');
        this.transporter = nodemailer.createTransport({
          name: 'mock',
          version: '1.0.0',
          send: (mail, callback) => {
            const mockInfo: SentMessageInfo = {
              messageId: `mock-${Date.now()}`,
              envelope: {
                from: mail.data.from as string,
                to: (mail.data.to as string[]) || [],
              },
              accepted: [(mail.data.to as string[])?.[0] || ''],
              rejected: [],
              pending: [],
              response: 'Mock email sent successfully',
            };
            this.logger.debug('Mock email:', mail.data);
            callback(null, mockInfo);
          },
        });
      } else {
        // Initialize real SMTP transporter
        this.transporter = nodemailer.createTransport({
          host: this.emailConfig.smtp.host,
          port: this.emailConfig.smtp.port,
          secure: this.emailConfig.smtp.secure,
          auth: this.emailConfig.smtp.auth,
          debug: this.emailConfig.debug,
          this.logger.log("Email", mail.data);
        });

        // Verify the connection
        await this.transporter.verify();
      }

      this.initialized = true;
    } catch (error) {
      this.logger.error('Failed to initialize email transporter', {
        error: error.message,
        config: {
          host: this.emailConfig.smtp.host,
          port: this.emailConfig.smtp.port,
          secure: this.emailConfig.smtp.secure,
        },
      });
      throw error;
    }
  }

  async sendMail(options: nodemailer.SendMailOptions): Promise<SentMessageInfo> {
    if (!this.initialized) {
      throw new Error('Email service is not initialized');
    }

    try {
      const result = await this.transporter.sendMail({
        ...options,
        from: options.from || this.emailConfig.smtp.auth.user,
      });

      this.logger.debug('Email sent successfully', {
        messageId: result.messageId,
        to: options.to,
        subject: options.subject,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to send email', {
        error: error.message,
        to: options.to,
        subject: options.subject,
      });
      throw error;
    }
  }

  // Additional methods for specific email types can be added here
  async sendVerificationEmail(email: string, token: string): Promise<SentMessageInfo> {
    const context = {
      verificationUrl: `${this.emailConfig.baseUrl}/verify-email?token=${token}`,
      supportEmail: this.emailConfig.supportEmail,
    };

    const htmlContent = await this.emailTemplateService.renderTemplate('verification', context);

    return this.sendMail({
      to: email,
      subject: 'Verify Your Email Address',
      html: htmlContent,
    });
  }
}
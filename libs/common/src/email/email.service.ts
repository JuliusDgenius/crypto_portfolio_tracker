import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SentMessageInfo } from 'nodemailer';
import { EmailTemplateService } from './email-template.service';
import { EmailConfig } from '../../../common/src';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private initialized = false;
  private emailConfig: EmailConfig;

  constructor(
    private readonly emailTemplateService: EmailTemplateService,
    private readonly configService: ConfigService,
  ) {}

  private validateAndInitializeConfig(): void {
    // Check if email service is enabled
    const emailEnabled = this.configService.get<boolean>('EMAIL_ENABLED', false);

    if (!emailEnabled) {
      this.logger.log('Email service is disabled. Using mock configuration.');
      this.emailConfig = {
        host: 'mock',
        port: 0,
        secure: false,
        auth: {
          user: 'mock',
          pass: 'mock',
        },
        mock: true,
        debug: true,
        logger: true,
        baseUrl: this.configService.get<string>('EMAIL_BASE_URL', 'http://localhost:3000'),
        supportEmail: this.configService.get<string>('SUPPORT_EMAIL', 'support@mock.com'),
      };
      return;
    }

    // For enabled email service, validate all required configurations
    const requiredConfig: EmailConfig = {
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      baseUrl: this.configService.get<string>('EMAIL_BASE_URL'),
      supportEmail: this.configService.get<string>('SUPPORT_EMAIL'),
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
      logger: this.configService.get<boolean>('EMAIL_LOGGER', false),
      mock: false,
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
      if (this.emailConfig.mock) {
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
          host: this.emailConfig.host,
          port: this.emailConfig.port,
          secure: this.emailConfig.secure,
          auth: this.emailConfig.auth,
          debug: this.emailConfig.debug,
          logger: this.emailConfig.logger,
        });

        // Verify the connection
        await this.transporter.verify();
      }

      this.initialized = true;
    } catch (error) {
      this.logger.error('Failed to initialize email transporter', {
        error: error.message,
        config: {
          host: this.emailConfig.host,
          port: this.emailConfig.port,
          secure: this.emailConfig.secure,
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
        from: options.from || this.emailConfig.auth.user,
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
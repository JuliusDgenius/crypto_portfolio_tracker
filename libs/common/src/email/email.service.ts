import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SentMessageInfo } from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  debug?: boolean;
  logger?: boolean;
  mock?: boolean;
  baseUrl: string;  // Base URL for the application (for creating verification/reset links)
  supportEmail: string;  // Support email address to show in templates
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private initialized = false;

  constructor(private readonly config: EmailConfig) {
    this.initializeTransporter().catch(error => {
      this.logger.warn(`Email service initialization failed: ${error.message}`);
      this.initialized = false;
    });
  }

  private async initializeTransporter() {
    try {
      if (this.config.mock) {
        this.logger.log('Initializing mock email transport');
        this.transporter = nodemailer.createTransport({
          name: 'mock',
          version: '1.0.0',
          send: (mail, callback) => {
            const mockResponse: SentMessageInfo = {
              messageId: `mock-${Date.now()}`,
              envelope: {
                from: mail.data.from as string,
                to: (mail.data.to as string[]) || []
              },
              accepted: [(mail.data.to as string[])?.[0] || ''],
              rejected: [],
              pending: [],
              response: 'Mock email sent successfully'
            };
            
            this.logger.debug('Mock email sent:', mail.data);
            callback(null, mockResponse);
          },
        });
        this.initialized = true;
        return;
      }

      this.transporter = nodemailer.createTransport(this.config);

      // Verify connection configuration
      await this.transporter.verify();
      this.initialized = true;
      this.logger.log('Email service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize email service', error.stack);
      throw error;
    }
  }

  async sendMail(options: nodemailer.SendMailOptions) {
    if (!this.initialized) {
      this.logger.warn('Attempted to send email while service is not initialized');
      return;
    }

    try {
      const result = await this.transporter.sendMail(options);
      this.logger.debug(`Email sent: ${result.messageId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sends a verification email to a user with a verification token.
   * @param email - The recipient's email address
   * @param token - The verification token
   * @returns A promise that resolves when the email is sent
   */
  async sendVerificationEmail(email: string, token: string): Promise<SentMessageInfo> {
    const template = await this.loadTemplate('verification');
    const verificationUrl = `${this.config.baseUrl}/verify-email?token=${token}`;

    const htmlContent = template.template({
      verificationUrl,
      supportEmail: this.config.supportEmail,
      validityPeriod: '24 hours'
    });

    return this.sendMail({
      to: email,
      subject: template.subject,
      html: htmlContent
    });
  }

  /**
   * Sends a password reset email to a user.
   * @param email - The recipient's email address
   * @param token - The password reset token
   * @returns A promise that resolves when the email is sent
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<SentMessageInfo> {
    const template = await this.loadTemplate('password-reset');
    const resetUrl = `${this.config.baseUrl}/reset-password?token=${token}`;

    const htmlContent = template.template({
      resetUrl,
      supportEmail: this.config.supportEmail,
      validityPeriod: '1 hour'
    });
    return this.sendMail({
      to: email,
      subject: template.subject,
      html: htmlContent
    });
  }

  /**
   * Loads and compiles an email template from the templates directory.
   * @param templateName - The name of the template to load (without extension)
   * @returns A promise that resolves with the template configuration and compiled template
   */
  private async loadTemplate(templateName: string): Promise<EmailTemplate> {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
      const configPath = path.join(this.templatesDir, `${templateName}.config.json`);

      // Read template file
      const templateContent = await fs.promises.readFile(templatePath, 'utf-8');

      // Read template configuration
      const configContent = await fs.promises.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);

      // Compile the template
      const template = handlebars.compile(templateContent);

      return {
        subject: config.subject,
        template
      };
    } catch (error) {
      this.logger.error(`Failed to load template ${templateName}:`, error.stack);
      throw new Error(`Failed to load email template: ${templateName}`);
    }
  }
}
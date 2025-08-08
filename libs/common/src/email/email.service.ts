import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EmailConfig } from '../interfaces';
import { join } from 'path';
import { User } from '@prisma/client';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly emailConfig: EmailConfig;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.emailConfig = this.configService.get<EmailConfig>('email');
    this.logger.log('Email Service initialized with config:', {
      host: this.emailConfig?.host,
      port: this.emailConfig?.port,
      enabled: this.emailConfig?.emailEnabled,
      templatesDir: join(__dirname, 'templates')
    });
  }

  /**
   * Base method to send emails with proper error handling and logging
   */
  private async sendEmail(
    to: string,
    subject: string,
    template: string,
    context: any,
    from?: string,
  ): Promise<void> {
    if (!this.emailConfig.emailEnabled) {
      this.logger.warn('Email sending is disabled via configuration');
      return;
    }

    try {
      await this.mailerService.sendMail({
        to,
        from: from || this.emailConfig.supportEmail,
        subject,
        template,
        context: {
          ...context,
          baseUrl: this.emailConfig.baseUrl,
          supportEmail: this.emailConfig.supportEmail,
          company_name: 'Crypto Portfolio Tracker',
          current_year: new Date().getFullYear(),
          recipient_email: to,
        },
      });
      this.logger.log(`Email sent successfully to ${to} using template ${template}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to} using template ${template}`,
        error.stack,
      );
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Sends email verification link to new users
   */
  async sendVerificationEmail(
    to: string,
    verificationToken: string,
    username: string,
  ): Promise<void> {
    const verificationLink = `${this.emailConfig.baseUrl}/verify-email?token=${verificationToken}`;
    
    await this.sendEmail(
      to,
      'Verify Your Email Address',
      'email-verification',
      {
        username,
        verificationLink,
        expiresIn: '24 hours',
      },
    );
  }

  /**
   * Sends password reset instructions
   */
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    username: string,
  ): Promise<void> {
    const resetLink = `${this.emailConfig.baseUrl}/reset-password?token=${resetToken}`;

    await this.sendEmail(
      to,
      'Reset Your Password',
      'password-reset',
      {
        username,
        resetLink,
        expiresIn: '1 hour',
      },
    );
  }

  /**
   * Sends welcome email after successful registration
   */
  async sendWelcomeEmail(
    to: string,
    username: string,
  ): Promise<void> {
    await this.sendEmail(
      to,
      'Welcome to Our Platform!',
      'welcome-email',
      {
        username,
        loginLink: `${this.emailConfig.baseUrl}/login`,
      },
    );
  }

  /**
   * Sends notification about suspicious login activity
   */
  async sendSecurityAlert(
    to: string,
    username: string,
    loginDetails: {
      timestamp: Date;
      ipAddress: string;
      deviceInfo: string;
      location?: string;
    },
  ): Promise<void> {
    await this.sendEmail(
      to,
      'Security Alert: New Login Detected',
      'security-alert',
      {
        username,
        loginDetails,
        settingsLink: `${this.emailConfig.baseUrl}/settings/security`,
      },
    );
  }

  /**
   * Sends account deletion confirmation
   */
  async sendAccountDeletionEmail(
    to: string,
    username: string,
  ): Promise<void> {
    await this.sendEmail(
      to,
      'Account Deletion Confirmation',
      'account-deletion',
      {
        username,
        supportEmail: this.emailConfig.supportEmail,
        reactivateLink: `${this.emailConfig.baseUrl}/reactivate-account`,
      },
    );
  }

  /**
   * Sends notification about password change
   */
  async sendPasswordChangeNotification(
    to: string,
    username: string,
  ): Promise<void> {
    await this.sendEmail(
      to,
      'Your Password Has Been Changed',
      'password-changed',
      {
        username,
        timestamp: new Date().toISOString(),
        supportEmail: this.emailConfig.supportEmail,
      },
    );
  }

  /**
   * Sends two-factor authentication setup confirmation
   */
  async sendTwoFactorSetupEmail(
    to: string,
    username: string,
  ): Promise<void> {
    await this.sendEmail(
      to,
      '2FA Has Been Enabled on Your Account',
      'two-factor-setup',
      {
        username,
        securitySettingsLink: `${this.emailConfig.baseUrl}/settings/security`,
      },
    );
  }
}
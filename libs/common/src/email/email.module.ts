import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { join } from 'path';
import { EmailConfig } from '../interfaces';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const emailConfig = configService.get<EmailConfig>('email');
        
        if (!emailConfig) {
          throw new Error('Email configuration is missing');
        }

        // In development, use the src path, in production use the dist path
        const templatesDir = process.env.NODE_ENV === 'production'
          ? join(process.cwd(), 'dist/apps/api/templates')
          : join(process.cwd(), 'libs/common/src/email/templates');

        return {
          // Transport configuration aligned with EmailConfig interface
          transport: {
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            auth: emailConfig.auth, // Using the auth object directly from interface
            debug: emailConfig.debug,
            logger: emailConfig.logger
          },
          defaults: {
            from: emailConfig.supportEmail, // Using supportEmail from interface
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
          // Add preview option for development if mock is enabled
          preview: emailConfig.mock || false,
        };
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
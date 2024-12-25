import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: EmailService,
      useFactory: (configService: ConfigService) => {
        const emailEnabled = configService.get<boolean>('EMAIL_ENABLED', false);
        
        if (!emailEnabled) {
          return new EmailService({
            host: 'mock',
            port: 0,
            secure: false,
            auth: {
              user: 'mock',
              pass: 'mock',
            },
            mock: true, // Enable mock mode
            debug: true,
            logger: true,
          });
        }

        return new EmailService({
          host: configService.getOrThrow<string>('SMTP_HOST'),
          port: configService.getOrThrow<number>('SMTP_PORT'),
          secure: configService.get<boolean>('SMTP_SECURE', true),
          auth: {
            user: configService.getOrThrow<string>('SMTP_USER'),
            pass: configService.getOrThrow<string>('SMTP_PASS'),
          },
          mock: false,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
// libs/common/src/email/email.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailTemplateService } from './email-template.service';
import { EmailService } from './email.service';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, EmailTemplateService],
  exports: [EmailService],
})
export class EmailModule {}

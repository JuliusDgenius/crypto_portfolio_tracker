import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';

@Module({
  imports: [
    // Configure the ConfigModule as global to make environment variables accessible throughout the application
    ConfigModule.forRoot({
      isGlobal: true, // Makes configuration available across all modules
      envFilePath: '.env', // Specify the path to your environment file
    }),
  ],
  // Register both services as providers in the module
  providers: [
    EmailService,
    EmailTemplateService,
    // You could also use custom providers if needed
    // {
    //   provide: EmailService,
    //   useFactory: (configService: ConfigService) => {
    //     return new EmailService(configService);
    //   },
    //   inject: [ConfigService],
    // },
  ],
  // Export EmailService to make it available to other modules
  exports: [EmailService],
})
export class EmailModule {}
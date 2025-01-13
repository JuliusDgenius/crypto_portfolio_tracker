import { Module } from '@nestjs/common';
import { WatchlistModule } from "../../watchlist/src";
import { BullModule } from "@nestjs/bull";
import { CryptoModule } from "../../crypto/src";
import { PortfolioModule } from "../../portfolio/src";
import { PortfolioAlertProcessor, PriceAlertProcessor } from './processors';
import { AlertProcessorService, AlertsService, NotificationService } from './services';
import { SystemAlertProcessor } from './processors';
import { DatabaseModule } from '../../database/src';
import { ConfigModule, ConfigService } from '../../config/src';
import { MailerModule } from '@nestjs-modules/mailer';
import { PriceAlertsController } from './controllers';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

@Module({
    imports: [
      BullModule.registerQueue({
        name: 'alerts',
      }),
      MailerModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('MAIL_HOST'),
          port: configService.get('MAIL_PORT'),
          secure: configService.get('MAIL_SECURE'),
          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: configService.get('MAIL_SUPPORT_EMAIL'),
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
        }),
      }),

      CryptoModule,
      PortfolioModule,
      WatchlistModule,
      ConfigModule,
      MailerModule,
      DatabaseModule
    ],
    providers: [
      // Core services
      AlertsService,
      AlertProcessorService,
      NotificationService,

      // Alert processors
      PriceAlertProcessor,
      PortfolioAlertProcessor,
      SystemAlertProcessor,
    ],
    controllers: [PriceAlertsController],
    exports: [AlertsService, AlertProcessorService, NotificationService],
  })
  export class AlertsModule {}
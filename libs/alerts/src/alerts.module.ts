import { Module } from '@nestjs/common';
import { WatchlistModule } from "../../watchlist/src";
import { BullModule } from "@nestjs/bull";
import { CryptoModule } from "../../crypto/src";
import { PortfolioModule } from "../../portfolio/src";
import { PortfolioAlertProcessor, PriceAlertProcessor } from './processors';
import { AlertProcessorService, AlertsService, NotificationService } from './services';
import { SystemAlertProcessor } from './processors';
import { DatabaseModule } from '../../database/src';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { PriceAlertsController } from './controllers';

@Module({
    imports: [
      BullModule.registerQueue({
        name: 'alerts',
      }),

      ConfigModule.forRoot(), // Added .forRoot() for proper initialization
      // MailerModule.forRoot({
      //   // Add mailer configuration here
      //   transport: {
      //     // SMTP configuration
      //   },
      //   defaults: {
      //     from: '"No Reply" <noreply@example.com>',
      //   },
      // }),

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
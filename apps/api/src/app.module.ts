import { 
  DatabaseModule,
} from '../../../libs/database/src';
import { AuthModule } from '../../../libs/auth/src';
import { CryptoModule } from '../../../libs/crypto/src';
import { PortfolioModule } from '../../../libs/portfolio/src';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { ScheduleModule } from '@nestjs/schedule';
import { WatchlistModule } from '../../../libs/watchlist/src';
import { AlertsModule } from '../../../libs/alerts/src';
import emailConfig from '../../../libs/common/src/email/config/email.config';
import * as Joi from 'joi';
import { CoreModule } from '../../../libs/core/src/core.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [emailConfig],
      validationSchema: Joi.object({
        MAIL_HOST: Joi.string().required(),
        MAIL_PORT: Joi.number().default(465),
        MAIL_SECURE: Joi.boolean().default(false),
        MAIL_USER: Joi.string().required(),
        MAIL_PASSWORD: Joi.string().required(),
        MAIL_DEBUG: Joi.boolean().default(false),
        MAIL_LOGGER: Joi.boolean().default(true),
        MAIL_MOCK: Joi.boolean().default(false),
        MAIL_BASE_URL: Joi.string().required(),
        MAIL_SUPPORT_EMAIL: Joi.string().email().required(),
        EMAIL_ENABLED: Joi.boolean().default(true),
      }),
    }),
    // ScheduleModule,
    DatabaseModule,
    AuthModule,
    CryptoModule,
    PortfolioModule,
    CoreModule,
    WatchlistModule,
    AlertsModule,
  ],
})
export class AppModule {}

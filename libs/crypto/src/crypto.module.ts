import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '../../config/src';
import { PriceService } from './services/price.service';
import { MarketService } from './services/market.service';
import { WebSocketService } from './services/websocket.service';
import { PriceUpdateJob } from './jobs/price-update.job';
import { RedisModule } from '../../database/src';
import { MarketController, PriceController, WebSocketController } from './controllers';
import { CryptoService } from './services/crypto.service';
import { ExchangeRateService } from './services/exchange-rate.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    RedisModule.forRoot({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    }),
  ],
  controllers: [
    MarketController, 
    PriceController,
    WebSocketController,
  ],
  providers: [
    PriceService, MarketService,
    WebSocketService, PriceUpdateJob,
    CryptoService, ExchangeRateService
  ],
  exports: [
    PriceService, MarketService,
    WebSocketService, CryptoService,
    ExchangeRateService
  ],
})
export class CryptoModule {}

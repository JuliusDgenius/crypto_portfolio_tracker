import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PriceService } from './services/price.service';
import { MarketService } from './services/market.service';
import { WebSocketService } from './services/websocket.service';
import { PriceUpdateJob } from './jobs/price-update.job';
import { RedisModule } from '../../database/src';
import { MarketController, PriceController } from './controllers';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    RedisModule.forRoot({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    }),
  ],
  controllers: [MarketController, PriceController],
  providers: [PriceService, MarketService, WebSocketService, PriceUpdateJob],
  exports: [PriceService, MarketService, WebSocketService],
})
export class CryptoModule {}
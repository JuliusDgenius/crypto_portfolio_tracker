import { Module } from '@nestjs/common';
import { WatchlistController } from './controllers/watchlist.controller';
import { WatchlistService } from './services/watchlist.service';
import { PrismaService } from '../../database/src';
import { PriceService } from '../../crypto/src/services/price.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [WatchlistController],
  providers: [WatchlistService, PrismaService, PriceService],
  exports: [WatchlistService],
})
export class WatchlistModule {}
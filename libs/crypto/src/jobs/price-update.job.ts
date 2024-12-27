import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PriceService } from '../services/price.service';
import { MarketService } from '../services/market.service';

@Injectable()
export class PriceUpdateJob {
  private readonly logger = new Logger(PriceUpdateJob.name);
  private readonly topCryptos = ['bitcoin', 'ethereum', 'binancecoin']; // Add more as needed

  constructor(
    private readonly priceService: PriceService,
    private readonly marketService: MarketService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async updatePrices() {
    try {
      await this.priceService.getPrices(this.topCryptos);
      this.logger.debug('Price update completed');
    } catch (error) {
      this.logger.error(`Price update failed: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async updateMarketData() {
    try {
      for (const crypto of this.topCryptos) {
        await this.marketService.getMarketData(crypto);
      }
      this.logger.debug('Market data update completed');
    } catch (error) {
      this.logger.error(`Market data update failed: ${error.message}`);
    }
  }
}
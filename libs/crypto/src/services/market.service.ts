import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { RedisService } from '../../../database/src';
import { catchError, firstValueFrom } from 'rxjs';
import { IMarketData } from '../interfaces';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly baseUrl: string;
  private readonly cachePrefix = 'crypto:market:';
  private readonly cacheDuration = 1800; // 30 minutes

  constructor(
    private readonly httpService: HttpService,
    private readonly redisService: RedisService,
  ) {
    this.baseUrl = 'https://api.coingecko.com/api/v3';
  }

  async getMarketData(symbol: string): Promise<IMarketData> {
    const cached = await this.redisService.get(`${this.cachePrefix}${symbol}`);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/coins/${symbol}`).pipe(
          catchError(error => {
            this.logger.error(`Failed to fetch market data: ${error.message}`);
            throw error;
          }),
        ),
      );

      const marketData: IMarketData = {
        symbol: data.id,
        name: data.name,
        marketCap: data.market_data.market_cap.usd,
        volume24h: data.market_data.total_volume.usd,
        circulatingSupply: data.market_data.circulating_supply,
        totalSupply: data.market_data.total_supply,
        rank: data.market_cap_rank,
        lastUpdated: new Date(),
      };

      await this.redisService.set(
        `${this.cachePrefix}${symbol}`,
        JSON.stringify(marketData),
        'EX',
        this.cacheDuration
      );

      return marketData;
    } catch (error) {
      this.logger.error(`Error fetching market data: ${error.message}`);
      throw error;
    }
  }
}
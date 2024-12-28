import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '../../../config/src';
import { RedisService } from '../../../database/src';
import { catchError, firstValueFrom } from 'rxjs';
import { ICryptoPrice, IPriceResponse } from '../interfaces';

/**
 * Service for fetching and caching cryptocurrency prices.
 */
@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);
  private readonly baseUrl: string;
  private readonly cachePrefix = 'crypto:price:';
  private readonly cacheDuration = 300; // 5 minutes

  /**
   * Creates an instance of PriceService.
   * @param httpService - The HTTP service for making API requests.
   * @param configService - The configuration service for accessing app settings.
   * @param redisService - The Redis service for caching prices.
   */
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.baseUrl = this.configService.get('COINGECKO_API_BASE_URL');
  }

  /**
   * Retrieves the prices for the given cryptocurrency symbols.
   * @param symbols - An array of cryptocurrency symbols to fetch prices for.
   * @returns A promise that resolves to an array of ICryptoPrice objects.
   */
  async getPrices(symbols: string[]): Promise<ICryptoPrice[]> {
    const cachedData = await this.getCachedPrices(symbols);
    if (cachedData.length === symbols.length) {
      return cachedData;
    }

    const missingSymbols = symbols.filter(
      symbol => !cachedData.find(price => price.symbol === symbol)
    );

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<IPriceResponse>(`${this.baseUrl}/simple/price`, {
          params: {
            ids: missingSymbols.join(','),
            vs_currencies: 'usd',
            include_24hr_change: true,
          },
        }).pipe(
          catchError(error => {
            this.logger.error(`Failed to fetch prices: ${error.message}`);
            throw error;
          }),
        ),
      );

      const prices = Object.entries(data).map(([id, priceData]) => ({
        symbol: id,
        price: priceData.usd,
        change24h: priceData.usd_24h_change,
        lastUpdated: new Date(),
      }));

      await this.cachePrices(prices);
      return [...cachedData, ...prices];
    } catch (error) {
      this.logger.error(`Error fetching prices: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves cached prices for the given symbols from Redis.
   * @param symbols - An array of cryptocurrency symbols to fetch cached prices for.
   * @returns A promise that resolves to an array of ICryptoPrice objects.
   */
  private async getCachedPrices(symbols: string[]): Promise<ICryptoPrice[]> {
    const cachedPrices: ICryptoPrice[] = [];
    
    for (const symbol of symbols) {
      const cached = await this.redisService.get(`${this.cachePrefix}${symbol}`);
      if (cached) {
        cachedPrices.push(JSON.parse(cached));
      }
    }
    
    return cachedPrices;
  }

  /**
   * Caches the given prices in Redis.
   * @param prices - An array of ICryptoPrice objects to cache.
   * @returns A promise that resolves when the caching is complete.
   */
  private async cachePrices(prices: ICryptoPrice[]): Promise<void> {
    const pipeline = this.redisService.pipeline();
    
    prices.forEach(price => {
      pipeline.set(
        `${this.cachePrefix}${price.symbol}`,
        JSON.stringify(price),
        'EX',
        this.cacheDuration
      );
    });
    
    await pipeline.exec();
  }
}

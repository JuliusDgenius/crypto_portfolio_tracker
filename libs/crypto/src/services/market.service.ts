import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { RedisService } from '../../../database/src';
import { catchError, firstValueFrom } from 'rxjs';
import { ConfigService } from '../../../config/src';
import { IMarketData, IMarketSearchResult, IMarketTrendingResult } from '../interfaces';

/**
 * Service for fetching market data from the CoinGecko API and caching it in Redis.
 */
@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly baseUrl: string;
  private readonly cachePrefix = 'crypto:market:';
  private readonly searchCachePrefix = 'crypto:search:';
  private readonly trendingCachePrefix = 'crypto:trending:';
  private readonly cacheDuration = 1800; // 30 minutes
  private readonly trendingCacheDuration = 300; // 5 minutes for trending data

  /**
   * Creates an instance of MarketService.
   * @param httpService - The HTTP service for making API requests.
   * @param redisService - The Redis service for caching market data.
   */
  constructor(
    private readonly httpService: HttpService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService
  ) {
    this.baseUrl = this.configService.get('COINGECKO_API_BASE_URL');
  }

  /**
   * Retrieves market data for a given cryptocurrency symbol.
   * @param symbol - The symbol of the cryptocurrency (e.g., 'bitcoin').
   * @returns A promise that resolves to the market data for the specified symbol.
   * @throws An error if fetching market data fails.
   */
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

  /**
   * Search for cryptocurrencies based on a query string
   * @param query - Search query string
   * @param limit - Maximum number of results to return (default: 10)
   * @returns Promise containing array of search results
   */
  async searchMarket(query: string, limit: number = 10): Promise<IMarketSearchResult[]> {
    const cacheKey = `${this.searchCachePrefix}${query}:${limit}`;
    const cached = await this.redisService.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/search`, {
          params: {
            query: query.toLowerCase(),
          },
        }).pipe(
          catchError(error => {
            this.logger.error(`Failed to search market: ${error.message}`);
            throw error;
          }),
        ),
      );

      // Get additional market data for the coins found
      const coinIds = data.coins.slice(0, limit).map(coin => coin.id);
      const marketData = await this.getMarketDataBatch(coinIds);

      const results: IMarketSearchResult[] = data.coins
        .slice(0, limit)
        .map(coin => ({
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: marketData[coin.id]?.current_price || 0,
          marketCap: marketData[coin.id]?.market_cap || 0,
          lastUpdated: new Date(),
        }));

      await this.redisService.set(
        cacheKey,
        JSON.stringify(results),
        'EX',
        this.cacheDuration
      );

      return results;
    } catch (error) {
      this.logger.error(`Error searching market: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get trending cryptocurrencies
   * @returns Promise containing array of trending cryptocurrencies
   */
  async getTrending(): Promise<IMarketTrendingResult[]> {
    const cacheKey = `${this.trendingCachePrefix}trending`;
    const cached = await this.redisService.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/search/trending`).pipe(
          catchError(error => {
            this.logger.error(`Failed to fetch trending: ${error.message}`);
            throw error;
          }),
        ),
      );

      // Get additional market data for trending coins
      const coinIds = data.coins.map(coin => coin.item.id);
      const marketData = await this.getMarketDataBatch(coinIds);
      console.log('marketData', marketData)

      const trending: IMarketTrendingResult[] = data.coins.map(coin => ({
        symbol: coin.item.symbol.toUpperCase(),
        name: coin.item.name,
        marketCap: marketData[coin.item.id]?.market_cap || 0,
        price: marketData[coin.item.id]?.current_price || 0,
        change24h: marketData[coin.item.id]?.price_change_percentage_24h || 0,
        lastUpdated: new Date(),
      }));

      await this.redisService.set(
        cacheKey,
        JSON.stringify(trending),
        'EX',
        this.trendingCacheDuration
      );
      console.log(trending)
      return trending;
    } catch (error) {
      this.logger.error(`Error fetching trending: ${error.message}`);
      throw error;
    }
  }

  /**
   * Helper method to fetch market data for multiple coins in one request
   * @param coinIds - Array of coin IDs to fetch data for
   * @returns Promise containing market data for requested coins
   */
  private async getMarketDataBatch(coinIds: string[]): Promise<Record<string, any>> {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/coins/markets`, {
        params: {
          ids: coinIds.join(','),
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: coinIds.length,
          sparkline: false,
        },
      }).pipe(
        catchError(error => {
          this.logger.error(`Failed to fetch batch market data: ${error.message}`);
          throw error;
        }),
      ),
    );

    return data.reduce((acc, coin) => {
      acc[coin.id] = coin;
      return acc;
    }, {});
  }
}

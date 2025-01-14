import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '../../../config/src';
import { RedisService } from '../../../database/src';
import { catchError, firstValueFrom } from 'rxjs';
import {
  ICryptoPrice,
  IHistoricalPrice,
  IMarketStats,
  IPriceAlert,
  IPriceResponse,
  ITechnicalIndicator,
  IAssetInfo
} from '../interfaces';

/**
 * Service for fetching and caching cryptocurrency prices.
 */
@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly cachePrefix = 'crypto:price:';
  private readonly cacheDuration = 300; // 5 minutes

  // Cache configuration for different data types
  private readonly cacheConfig = {
    currentPrice: {
      prefix: 'crypto:price:current:',
      duration: 300 // 5 minutes
    },
    historicalPrice: {
      prefix: 'crypto:price:history:',
      duration: 3600 // 1 hour
    },
    marketStats: {
      prefix: 'crypto:stats:',
      duration: 900 // 15 minutes
    },
    technicalIndicators: {
      prefix: 'crypto:indicators:',
      duration: 600 // 10 minutes
    }
  };

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
    this.apiKey = this.configService.get('COINGECKO_API_KEY');
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
          headers: {
            'x-cg-api-key': this.apiKey
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

  /**
 * Retrieves historical price data for a cryptocurrency.
  * @param symbol - Cryptocurrency ID (e.g., 'bitcoin')
  * @param range - Time range ('1d', '7d', '30d', '90d', '1y')
  * @param interval - Data interval ('hourly', 'daily')
  */
  async getHistoricalPrices(
    symbol: string,
    range: string,
    interval: string
  ): Promise<IHistoricalPrice[]> {
    const cacheKey = `${this.cacheConfig.historicalPrice.prefix}${symbol}:${range}:${interval}`;
    
    // Try to get data from cache first
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      
      // Check if cached data is still valid for the requested range
      if (this.isHistoricalDataValid(parsedData, range)) {
        return parsedData;
      }
    }

    try {
      // Convert interval to CoinGecko interval
      const geckoInterval = this.getGeckoInterval(range);

      // Fetch data from API
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/coins/${symbol}/market_chart`, {
          params: {
            vs_currency: 'usd',
            days: this.getNumberOfDays(range),
            interval: geckoInterval
          }
        }).pipe(
          catchError(error => {
            if (error.response?.status === 429) {
              this.logger.error('Rate limit exceeded for CoinGecko API');
              throw new Error('Rate limit exceeded. Please try again later.');
            }
            this.logger.error(`Failed to fetch historical prices: ${error.message}`);
            throw error;
          })
        )
      );

      const formattedData = this.formatHistoricalData(data);
      
      // Cache the data with sliding window strategy
      await this.redisService.set(
        cacheKey,
        JSON.stringify(formattedData),
        'EX',
        this.cacheConfig.historicalPrice.duration
      );

      return formattedData;
    } catch (error) {
      this.logger.error(`Error fetching historical prices: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves comprehensive market statistics for a cryptocurrency.
   * Implements a tiered caching strategy with different expiration times
   * for different types of data.
   */
  async getMarketStats(symbol: string): Promise<IMarketStats> {
    const cacheKey = `${this.cacheConfig.marketStats.prefix}${symbol}`;
    
    const cachedStats = await this.redisService.get(cacheKey);
    if (cachedStats) {
      return JSON.parse(cachedStats);
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/coins/${symbol}`, {
          params: {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false
          }
        }).pipe(
          catchError(error => {
            this.logger.error(`Failed to fetch market stats: ${error.message}`);
            throw error;
          })
        )
      );

      const stats = this.formatMarketStats(data);
      
      // Cache with appropriate expiration
      await this.redisService.set(
        cacheKey,
        JSON.stringify(stats),
        'EX',
        this.cacheConfig.marketStats.duration
      );

      return stats;
    } catch (error) {
      this.logger.error(`Error fetching market stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Compares price performance of multiple cryptocurrencies.
   * Uses batch processing for efficient data retrieval.
   */
  async comparePrices(
    symbols: string[],
    timeframe: string
  ): Promise<Record<string, IHistoricalPrice[]>> {
    const comparison = {};
    
    // Use Promise.all for parallel processing
    await Promise.all(
      symbols.map(async (symbol) => {
        comparison[symbol] = await this.getHistoricalPrices(
          symbol,
          timeframe,
          this.getOptimalInterval(timeframe)
        );
      })
    );

    return comparison;
  }

  /**
   * Retrieves technical indicators for price analysis.
   * Implements calculation caching to avoid repeated computations.
   */
  async getPriceIndicators(
    symbol: string,
    indicators: string[]
  ): Promise<Record<string, ITechnicalIndicator>> {
    const cacheKey = `${this.cacheConfig.technicalIndicators.prefix}${symbol}`;
    
    const cachedIndicators = await this.redisService.get(cacheKey);
    if (cachedIndicators) {
      const parsed = JSON.parse(cachedIndicators);
      // Check if we have all requested indicators
      if (indicators.every(ind => ind in parsed)) {
        return parsed;
      }
    }

    try {
      // Fetch required historical data for calculations
      const historicalData = await this.getHistoricalPrices(symbol, '30d', '1h');
      
      // Calculate requested indicators
      const result = {};
      for (const indicator of indicators) {
        result[indicator] = await this.calculateIndicator(
          indicator,
          historicalData
        );
      }

      // Cache the results
      await this.redisService.set(
        cacheKey,
        JSON.stringify(result),
        'EX',
        this.cacheConfig.technicalIndicators.duration
      );

      return result;
    } catch (error) {
      this.logger.error(`Error calculating indicators: ${error.message}`);
      throw error;
    }
  }

  /**
 * Retrieves basic asset information including name and current price.
 * Uses a dedicated cache configuration to optimize frequent lookups.
 * 
 * @param symbol - The cryptocurrency symbol/id to fetch information for
 * @returns Promise containing the asset's name and current price
 * @throws Error if the asset information cannot be retrieved
 */
async getAssetInfo(symbol: string): Promise<IAssetInfo> {
  this.logger.debug(`Getting asset info for ${symbol}`);
  const cacheKey = `${this.cacheConfig.currentPrice.prefix}info:${symbol}`;
  
  // Check cache first
  const cachedInfo = await this.redisService.get(cacheKey);
  if (cachedInfo) {
    this.logger.debug(`Retrieved cached info for ${symbol}:`, cachedInfo);
    return JSON.parse(cachedInfo);
  }

  this.logger.debug(`Cache miss for ${symbol}, fetching from API`);

  try {
    // Make a focused API call to get just what we need
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/coins/${symbol}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false
        },
        headers: {
          'x-cg-api-key': this.apiKey
        }
      }).pipe(
        catchError(error => {
          this.logger.error(`Failed to fetch asset info: ${error.message}`);
          throw error;
        })
      )
    );

    this.logger.debug(`API response for ${symbol}:`, {
      name: data.name,
      price: data.market_data?.current_price?.usd
    });
    
    const assetInfo: IAssetInfo = {
      name: data.name,
      symbol: data.symbol.toUpperCase(),
      price: data.market_data.current_price.usd
    };

    // Cache the result with a shorter duration since it's frequently accessed
    await this.redisService.set(
      cacheKey,
      JSON.stringify(assetInfo),
      'EX',
      this.cacheConfig.currentPrice.duration
    );

    return assetInfo;
  } catch (error) {
    this.logger.error(`Error fetching asset info for ${symbol}: ${error.message}`);
    throw error;
  }
}

  // Private helper methods

  private getNumberOfDays(range: string): number {
    const rangeMappings = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    return rangeMappings[range] || 30;
  }

  private getOptimalInterval(timeframe: string): string {
    const intervalMappings = {
      '24h': '1h',
      '7d': '4h',
      '30d': '1d',
      '90d': '1d',
      '1y': '1d'
    };
    return intervalMappings[timeframe] || '1d';
  }

  private isHistoricalDataValid(
    data: IHistoricalPrice[],
    range: string
  ): boolean {
    if (!data.length) return false;
    
    const lastDataPoint = new Date(data[data.length - 1].timestamp);
    const requiredAge = this.getNumberOfDays(range);
    
    return (
      Date.now() - lastDataPoint.getTime() <
      requiredAge * 24 * 60 * 60 * 1000
    );
  }

  private async calculateIndicator(
    indicator: string,
    historicalData: IHistoricalPrice[]
  ): Promise<ITechnicalIndicator> {
    // Implementation of technical indicator calculations
    // This would include RSI, moving averages, etc.
    // Returns calculated indicator values
    return null; // Placeholder
  }

  private formatHistoricalData(data: any): IHistoricalPrice[] {
    return data.prices.map(([timestamp, price]) => ({
      timestamp: new Date(timestamp).toISOString(),
      price,
    }));
  }

  private getGeckoInterval(range: string): string {
    // For ranges <= 90 days, we can use hourly data
    const days = this.getNumberOfDays(range);
    if (days <= 1) return 'minutely';
    if (days <= 90) return 'hourly';
    return 'daily';
  }

  private formatMarketStats(data: any): IMarketStats {
    return {
      marketCap: data.market_data.market_cap.usd,
      volume24h: data.market_data.total_volume.usd,
      circulatingSupply: data.market_data.circulating_supply,
      totalSupply: data.market_data.total_supply,
      allTimeHigh: {
        price: data.market_data.ath.usd,
        date: data.market_data.ath_date.usd,
      },
      priceChange: {
        '1h': data.market_data.price_change_percentage_1h_in_currency.usd,
        '24h': data.market_data.price_change_percentage_24h_in_currency.usd,
        '7d': data.market_data.price_change_percentage_7d_in_currency.usd,
        '30d': data.market_data.price_change_percentage_30d_in_currency.usd,
      },
      marketCapRank: data.market_cap_rank,
      allTimeLow: {
        price: data.market_data.atl.usd,
        date: data.market_data.atl_date.usd,
      }
    };
  }
}

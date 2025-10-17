import { 
  BadRequestException, 
  Injectable, 
  InternalServerErrorException, 
  Logger, 
  UnauthorizedException} from '@nestjs/common';
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
  private readonly apiPlan: string;
  private readonly cacheDuration: number; // 5 minutes
  private readonly perPage = this.configService.get<number>('PER_PAGE');
  private readonly maxRetries = this.configService.get<number>('MAX_RETRIES');
  private readonly retryDelay = this.configService.get<number>('RETRY_DELAY');
  private readonly timeout = this.configService.get<number>('TIMEOUT');
  private readonly cachePrefix = this.configService.get<string>('CACHE_PREFIX');


  // Cache configuration for different data types
  private readonly cacheConfig = {
    currentPrice: {
      prefix: this.cachePrefix,
      duration: 300 // 5 minutes
    },
    historicalPrice: {
      prefix: this.cachePrefix + ':history:',
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

  private readonly dynamicCacheDurations = {
    '24h': 300,     // 5 minutes
    '7d': 1800,     // 30 minutes
    '30d': 3600,    // 1 hour
    '90d': 7200,    // 2 hours
    '1y': 21600     // 6 hours
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
    this.logger.debug(`[COINGECKO BASE URL] ${this.baseUrl}`);
    this.apiKey = this.configService.get('COINGECKO_API_KEY');
    this.logger.debug(`[COINGECKO KEY CHECK] ${this.apiKey ? 'API key detected' : 'API key is undefined/null'}`);
    this.cacheDuration = this.configService.get<number>('CACHE_DURATION') || 300;
    this.apiPlan = this.configService.get<string>('COINGECKO_API_PLAN') || 'free';
    
    // Warn if API key is missing
    if (!this.apiKey) {
      this.logger.warn('COINGECKO_API_KEY is not configured. Some features may not work properly.');
    }
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
      throw new InternalServerErrorException(`Error fetching prices: ${error.message}`);
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
    this.logger.debug(`[HISTORICAL] Checking cache for ${symbol} (${range})...`);
    
    // Try to get data from cache first
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      
      // Check if cached data is still valid for the requested range
      if (this.isHistoricalDataValid(parsedData, range)) {
        this.logger.debug(`[HISTORICAL] Cache hit for ${symbol} (${range})`);
        return parsedData;
      } else {
        this.logger.debug(`[HISTORICAL] Cache invalid for ${symbol} (${range}) — refreshing...`);
      }
    }

    try {
      // Convert interval to CoinGecko interval
      const geckoInterval = this.getGeckoInterval(range);
      const days = this.getNumberOfDays(range);
      // Determine interval parameter for CoinGecko free API
      const params: any = { vs_currency: 'usd', days };
      if (this.apiPlan === 'pro' && interval) {
        const optimal = this.getOptimalInterval(range);
        params.interval = this.mapToGeckoInterval(optimal);
      }

      this.logger.log(
        `[HISTORICAL FETCH START] ${symbol} | range=${range}, interval=${geckoInterval}, days=${days}`
      );

      // Fetch data from API
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/coins/${symbol}/market_chart`, {
          params,
          headers: {
            'x-cg-api-key': this.apiKey
          }
        }).pipe(
          catchError(error => {
            const status = error.response?.status;
            const errMsg = error.message || 'Unknown error';
            const body = JSON.stringify(error.response?.data || {});
            this.logger.error(
              `[HISTORICAL FETCH FAIL] ${symbol} | status=${status} | message=${errMsg} | body=${body}`
            );

            if (status === 401) {
              throw new UnauthorizedException('Unauthorized: Check your CoinGecko API key.');
            }
            if (status === 429) {
              throw new BadRequestException('Rate limit exceeded. Try again later.');
            }
            throw new InternalServerErrorException(`Failed request for ${symbol}: ${errMsg}`);
          })
        )
      );

      const formattedData = this.formatHistoricalData(data);
      const cacheDuration = this.getCacheDurationForTimeframe(range);

      this.logger.debug(
        `Caching historical data for ${symbol} (${range}) with TTL: ${cacheDuration}s`
      );

      // Cache the data with sliding window strategy
      await this.redisService.set(
        cacheKey,
        JSON.stringify(formattedData),
        'EX',
        cacheDuration
      );
      this.logger.log(
        `[HISTORICAL FETCH SUCCESS] ${symbol} | ${formattedData.length} points`
      );
      return formattedData;
    } catch (error) {
      const message = error.message || 'No error message';
      this.logger.error(`[HISTORICAL ERROR] ${symbol} | ${message}`);
      throw new InternalServerErrorException(`Failed fetch historical data`);
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
            throw Error;
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
      throw new InternalServerErrorException('Failed to fetch market stats');
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
    const comparison: Record<string, IHistoricalPrice[]> = {};

    if (!symbols && symbols.length === 0) {
      throw new BadRequestException('symbols query parameter is required');
    }

    const cacheDuration = this.getCacheDurationForTimeframe(timeframe);
    this.logger.log(
      `[COMPARE START] symbols=${symbols.join(', ')} | 
      timeframe=${timeframe} | cacheDuration=${cacheDuration}`
    );
    
    // Use Promise.allSettled for parallel processing
    const results = await Promise.allSettled(
      symbols.map(async (symbol) => {
        try {
          this.logger.log(`[FETCH START] ${symbol} for timeframe=${timeframe}`);
  
          const data = await this.getHistoricalPrices(
            symbol,
            timeframe,
            this.getOptimalInterval(timeframe)
          );
  
          this.logger.log(`[FETCH SUCCESS] ${symbol} | ${data.length} records`);
          return { symbol, data };
        } catch (err) {
          this.logger.error(`[FETCH ERROR] ${symbol} | ${err.message}`);
          throw new InternalServerErrorException('Failed to fetch compare price data');
        }
      })
    );

    results.forEach((result, index) => {
      const symbol = symbols[index];
      if (result.status === 'fulfilled') {
        comparison[result.value.symbol] = result.value.data;
      } else {
        this.logger.error(`[FETCH FAIL] ${symbol} | ${result.reason?.message || result.reason}`);
        comparison[symbol] = []; // empty fallback for failed requests
      }
    });
  
    this.logger.log(`[COMPARE COMPLETE] processed ${symbols.length} symbols`);

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
      throw new InternalServerErrorException('Failed to calculate indicators');
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
  const geckoId = this.coinGeckoIdMap[symbol.toUpperCase()] || symbol.toLowerCase();
  this.logger.debug(`Gecko ID for ${symbol}: ${geckoId}`);
  const cacheKey = `${this.cacheConfig.currentPrice.prefix}info:${geckoId}`;
  
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
          throw new InternalServerErrorException('Failed to fetch asset info');
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
    throw new InternalServerErrorException('Failed to fetch asset info');
  }
}

/**
 * Retrieves a list of available cryptocurrencies 
 * with their basic information.
 * Uses caching to optimize performance and reduce API calls.
 * 
 * @returns Promise containing array of cryptocurrency information
 * @throws Error if the cryptocurrency list cannot be retrieved
 */
async getAvailableCryptos(): Promise<Array<{ 
  symbol: string; 
  name: string; 
  currentPrice: number 
}>> {
  const cacheKey = `${this.cacheConfig.currentPrice.prefix}available_cryptos`;
  const cached = await this.redisService.get(cacheKey);
  if (cached) {
    this.logger.log("Cache hit: Fetching catched data...");
    return JSON.parse(cached);
  }

  this.logger.log("Cache miss: Making API call for crypto assets...");
  try {
    const cryptos = await this.withRetry(
      () => this.fetchAvailableCryptosFromAPI(), 
      this.maxRetries, this.retryDelay
    );
    this.logger.log("Caching fetched data in Redis...");
    await this.redisService.set(
      cacheKey, JSON.stringify(cryptos), 'EX', 
      this.cacheConfig.currentPrice.duration
    );
    return cryptos;
  } catch (error) {
    this.logger.error(
      `getAvailableCryptos failed: ${
        error.status,
        error.message,
        error.stack
      }`
    );
    const stale = await this.redisService.get(cacheKey); 
    if (stale) {
      this.logger.warn('Returning stale cached data due to API failure');
      return JSON.parse(stale);
    }
    throw new InternalServerErrorException(
      'Unable to fetch available cryptocurrencies at this time.'
    );
  }
}

// Private helper methods
private async fetchAvailableCryptosFromAPI() {
  const { data } = await firstValueFrom(
    this.httpService.get(`${this.baseUrl}/coins/markets`, {
      params: { vs_currency: 'usd', order: 'market_cap_desc', 
        per_page: this.perPage, page: 1 
      },
      headers: { 'x-cg-api-key': this.apiKey },
      timeout: this.timeout,
    }),
  );

  if (!Array.isArray(data)) throw new Error('Invalid response format');

  return data
    .map(coin => {
      if (
        !coin?.symbol || !coin?.name || 
        typeof coin.current_price !== 'number') return null;
      return { 
        symbol: coin.symbol.toUpperCase(), 
        name: coin.name, 
        currentPrice: coin.current_price 
      };
    })
    .filter(Boolean);
}

private async withRetry<T>(
  fn: () => Promise<T>, 
  retries: number, 
  delay: number): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      this.logger.warn(`Retrying after error: ${err.message}`);
      await new Promise(r => setTimeout(r, delay * (i + 1))); // exponential-ish backoff
    }
  }
}

private getNumberOfDays(range: string): number {
  const match = range.match(/^(\d+)([hdmy])$/);
  if (!match) return 30;

  const [_, value, unit] = match;
  const num = parseInt(value, 10);

  switch (unit) {
    case 'h': return 1;     // anything in hours → treat as 1 day
    case 'd': return num;
    case 'm': return num * 30;
    case 'y': return num * 365;
    default: return 30;
  }
}


  private getOptimalInterval(timeframe: string): string {
    const intervalMappings = {
      '1h': 'hourly',
      '4h': 'hourly',
      '1d': 'daily'
    };
    return intervalMappings[timeframe] || '1d';
  }

  /**
 * Maps internal interval (e.g., '1h', '1d') to CoinGecko API interval
 */
private mapToGeckoInterval(optimalInterval: string): string {
  const mapping = {
    '1h': 'minutely',
    '4h': 'hourly',
    '1d': 'daily'
  };
  return mapping[optimalInterval] || '1h';
}

  /**
 * Determines cache duration dynamically based on timeframe.
 * Shorter timeframes get shorter cache lifetimes.
 */
  private getCacheDurationForTimeframe(timeframe: string): number {
    return this.dynamicCacheDurations[timeframe] || this.cacheDuration;
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

  private readonly coinGeckoIdMap: { [key: string]: string } = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'ADA': 'cardano',
    'SOL': 'solana',
    'DOT': 'polkadot',
    'AVAX': 'avalanche',
    'MATIC': 'polygon',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'ATOM': 'cosmos',
    'LTC': 'litecoin',
    'BCH': 'bitcoin-cash',
    'XRP': 'ripple',
    'DOGE': 'dogecoin',
    'SHIB': 'shiba-inu',
    'TRX': 'tron',
    'ETC': 'ethereum-classic',
    'XLM': 'stellar',
    'VET': 'vechain',
    'FIL': 'filecoin',
    'ALGO': 'algorand',
    'ICP': 'internet-computer',
    'XMR': 'monero',
    'AAPL': 'apple',
    'GOOGL': 'google',
    'MSFT': 'microsoft',
    'AMZN': 'amazon',
    'FB': 'facebook',
    'TWTR': 'twitter',
    'NFLX': 'netflix',
    'TSLA': 'tesla',
    'NVDA': 'nvidia',
    'AMD': 'amd',
    'INTC': 'intel',
    'ASML': 'asml-holding',
    // Add more mappings as needed
  };
}
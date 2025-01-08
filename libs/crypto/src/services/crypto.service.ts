import { Injectable, Logger } from '@nestjs/common';
import { ExchangeAccount } from '@prisma/client';
import { ExchangeType } from '../../../core/src';
import { ConfigService } from '@nestjs/config';
import * as ccxt from 'ccxt'; // Popular library for cryptocurrency exchange APIs

interface ExchangeBalance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private exchangeInstances: Map<string, any> = new Map();

  constructor(private configService: ConfigService) {}

  async testExchangeConnection(
    exchange: ExchangeType,
    apiKey: string,
    apiSecret: string,
  ): Promise<boolean> {
    try {
      const client = this.createExchangeClient(exchange, apiKey, apiSecret);
      await client.fetchBalance();
      return true;
    } catch (error) {
      this.logger.error(`Exchange connection test failed: ${error.message}`);
      return false;
    }
  }

  async syncExchangeData(account: ExchangeAccount): Promise<void> {
    try {
      const client = this.getOrCreateExchangeClient(account);
      
      // Fetch balances
      const balances = await this.fetchBalances(client);
      
      // Fetch recent trades
      const trades = await this.fetchRecentTrades(client);
      
      // Fetch open orders
      const openOrders = await this.fetchOpenOrders(client);

      // Process and store the data
      await this.processExchangeData(account.userId, {
        balances,
        trades,
        openOrders,
      });
    } catch (error) {
      this.logger.error(`Failed to sync exchange data: ${error.message}`);
      throw error;
    }
  }

  private createExchangeClient(
    exchange: ExchangeType,
    apiKey: string,
    apiSecret: string,
  ): ccxt.Exchange {
    const exchangeConfig = {
      apiKey,
      secret: apiSecret,
      timeout: 30000,
      enableRateLimit: true,
    };

    switch (exchange) {
      case ExchangeType.BINANCE:
        return new ccxt.binance({
          ...exchangeConfig,
          options: {
            adjustForTimeDifference: true,
          },
        });

      case ExchangeType.COINBASE:
        return new ccxt.coinbase({
          ...exchangeConfig,
        });

      case ExchangeType.KRAKEN:
        return new ccxt.kraken({
          ...exchangeConfig,
        });

      case ExchangeType.KUCOIN:
        return new ccxt.kucoin({
          ...exchangeConfig,
        });

      default:
        throw new Error(`Unsupported exchange: ${exchange}`);
    }
  }

  private getOrCreateExchangeClient(account: ExchangeAccount): ccxt.Exchange {
    const cacheKey = `${account.exchange}_${account.id}`;
    
    if (!this.exchangeInstances.has(cacheKey)) {
      const client = this.createExchangeClient(
        account.exchange as ExchangeType,
        account.apiKey,
        account.apiSecret,
      );
      this.exchangeInstances.set(cacheKey, client);
    }

    return this.exchangeInstances.get(cacheKey);
  }

  private async fetchBalances(client: ccxt.Exchange): Promise<ExchangeBalance[]> {
    try {
      const balances = await client.fetchBalance();
      return Object.entries(balances.total)
        .filter(([_, value]) => value > 0)
        .map(([asset, total]) => ({
          asset,
          free: balances.free[asset] || 0,
          locked: balances.used[asset] || 0,
          total,
        }));
    } catch (error) {
      this.logger.error(`Failed to fetch balances: ${error.message}`);
      throw error;
    }
  }

  private async fetchRecentTrades(
    client: ccxt.Exchange,
    since?: number,
    limit = 100,
  ): Promise<any[]> {
    try {
      const markets = await client.loadMarkets();
      const trades = [];

      for (const symbol of Object.keys(markets)) {
        if (client.has['fetchMyTrades']) {
          const marketTrades = await client.fetchMyTrades(symbol, since, limit);
          trades.push(...marketTrades);
        }
      }

      return trades.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      this.logger.error(`Failed to fetch trades: ${error.message}`);
      throw error;
    }
  }

  private async fetchOpenOrders(client: ccxt.Exchange): Promise<any[]> {
    try {
      if (!client.has['fetchOpenOrders']) {
        return [];
      }

      const markets = await client.loadMarkets();
      const orders = [];

      for (const symbol of Object.keys(markets)) {
        const marketOrders = await client.fetchOpenOrders(symbol);
        orders.push(...marketOrders);
      }

      return orders;
    } catch (error) {
      this.logger.error(`Failed to fetch open orders: ${error.message}`);
      throw error;
    }
  }

  private async processExchangeData(
    userId: string,
    data: {
      balances: ExchangeBalance[];
      trades: any[];
      openOrders: any[];
    },
  ): Promise<void> {
    // Here you would implement the logic to:
    // 1. Update portfolio balances
    // 2. Record new transactions
    // 3. Update average buy prices
    // 4. Calculate realized/unrealized gains
    // This would typically involve your portfolio service
    this.logger.log(`Processing exchange data for user ${userId}`);
    
    // Example implementation would go here...
    // await this.portfolioService.updateFromExchangeData(userId, data);
  }

  // Rate limiting and error handling utilities
  private async withRateLimit<T>(
    fn: () => Promise<T>,
    retryCount = 3,
  ): Promise<T> {
    for (let i = 0; i < retryCount; i++) {
      try {
        return await fn();
      } catch (error) {
        if (error.name === 'RateLimitExceeded') {
          const delay = Math.pow(2, i) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retry attempts reached');
  }

  // Cleanup method to clear exchange instances
  public clearExchangeInstances(): void {
    this.exchangeInstances.clear();
  }
}
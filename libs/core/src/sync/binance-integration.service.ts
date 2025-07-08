import { Injectable, Logger } from '@nestjs/common';
import Binance from 'binance-api-node';

@Injectable()
export class BinanceIntegrationService {
  private readonly logger = new Logger(BinanceIntegrationService.name);

  private getClient(apiKey: string, apiSecret: string) {
    return Binance({
      apiKey,
      apiSecret,
    });
  }

  async fetchBalances(apiKey: string, apiSecret: string) {
    const client = this.getClient(apiKey, apiSecret);
    try {
      const accountInfo = await client.accountInfo();
      // Normalize: Only return non-zero balances
      return accountInfo.balances
        .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
        .map(b => ({
          asset: b.asset,
          free: parseFloat(b.free),
          locked: parseFloat(b.locked),
        }));
    } catch (error) {
      this.logger.error('Binance fetchBalances error', error);
      throw error;
    }
  }

  async fetchTransactions(apiKey: string, apiSecret: string) {
    const client = this.getClient(apiKey, apiSecret);
    try {
      // Example: Fetch deposit and withdrawal history
      const deposits = await client.depositHistory({ coin: 'BTC' });
      const withdrawals = await client.withdrawHistory({ coin: 'BTC' });
      // Normalize as needed
      return {
        deposits,
        withdrawals,
      };
    } catch (error) {
      this.logger.error('Binance fetchTransactions error', error);
      throw error;
    }
  }
} 
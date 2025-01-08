import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  private rateCache: Map<string, { rate: number; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private configService: ConfigService) {}

  async getExchangeRate(from: string, to: string): Promise<number> {
    const cacheKey = `${from}_${to}`;
    const cached = this.rateCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.rate;
    }

    try {
      const rate = await this.fetchExchangeRate(from, to);
      this.rateCache.set(cacheKey, {
        rate,
        timestamp: Date.now(),
      });
      return rate;
    } catch (error) {
      this.logger.error(`Failed to fetch exchange rate: ${error.message}`);
      throw error;
    }
  }

  private async fetchExchangeRate(from: string, to: string): Promise<number> {
    // Implement your preferred exchange rate API here
    // Example using CoinGecko's API
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${from}&vs_currencies=${to}`,
    );
    const data = await response.json();
    return data[from][to];
  }
}

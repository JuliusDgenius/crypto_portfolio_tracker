import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/src';
import { PriceService } from '../../../crypto/src';
import { 
  PriceAlertCondition,
  ConditionEvaluationResult 
} from '../interfaces/alert-conditions.interface';

@Injectable()
export class PriceAlertProcessor {
  private readonly logger = new Logger(PriceAlertProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly priceService: PriceService,
  ) {}

  /**
   * Validates the conditions for a price alert before it's created
   * Ensures all required fields are present and values are within acceptable ranges
   */
  async validateConditions(conditions: PriceAlertCondition): Promise<boolean> {
    try {
      // Ensure required fields are present
      if (!conditions.cryptocurrency || !conditions.targetPrice) {
        this.logger.warn('Missing required fields in price alert conditions');
        return false;
      }

      // Validate price is positive
      if (conditions.targetPrice <= 0) {
        this.logger.warn(`Invalid price value: ${conditions.targetPrice}`);
        return false;
      }

      // Validate comparison operator
      if (!['ABOVE', 'BELOW'].includes(conditions.comparison)) {
        this.logger.warn(`Invalid comparison operator: ${conditions.comparison}`);
        return false;
      }

      // Here you might also validate that the cryptocurrency exists
      // in your system's supported assets
      const isValidCrypto = await this.validateCryptocurrency(conditions.cryptocurrency);
      if (!isValidCrypto) {
        this.logger.warn(`Invalid cryptocurrency: ${conditions.cryptocurrency}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error validating price alert conditions', error.stack);
      return false;
    }
  }

  /**
   * Evaluates price alert conditions against current market data
   * Returns a result indicating whether the alert should be triggered
   */
  async evaluateConditions(conditions: PriceAlertCondition): Promise<ConditionEvaluationResult> {
    try {
      this.logger.debug('Starting condition evaluation with conditions:', conditions);

      // Fetch current price from your price feed service
      const currentPrice = await this.getCurrentPrice(conditions.cryptocurrency);
      this.logger.debug(`Retrieved current price for ${conditions.cryptocurrency}: ${currentPrice}`);

      // Determine if the alert should be triggered based on the comparison
      const isTriggered = conditions.comparison === 'ABOVE'
        ? currentPrice > conditions.targetPrice
        : currentPrice < conditions.targetPrice;

      this.logger.debug(`Alert evaluation result: ${isTriggered}`, {
        currentPrice,
        targetPrice: conditions.targetPrice,
        comparison: conditions.comparison
      });

      return {
        isTriggered,
        currentValue: currentPrice,
        triggeredAt: new Date(),
        metadata: {
          cryptocurrency: conditions.cryptocurrency,
          targetPrice: conditions.targetPrice,
          currentPrice: currentPrice,
          comparison: conditions.comparison
        }
      };
    } catch (error) {
      this.logger.error('Error evaluating price alert conditions', error.stack);
      return {
        isTriggered: false,
        triggeredAt: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Validates that a cryptocurrency is supported by the system
   */
  private async validateCryptocurrency(cryptocurrency: string): Promise<boolean> {
    try {
      // In a real implementation, this would check against your system's
      // supported cryptocurrencies, perhaps from a database or API
      const supportedCrypto = await this.prisma.asset.findFirst({
        where: {
          symbol: cryptocurrency.toUpperCase()
        }
      });

      return !!supportedCrypto;
    } catch (error) {
      this.logger.error('Error validating cryptocurrency', error.stack);
      return false;
    }
  }

  /**
   * Fetches the current price for a cryptocurrency
   * In a real implementation, this would connect to your price feed service
   */
  private async getCurrentPrice(cryptocurrency: string): Promise<number> {
    try {
      this.logger.debug(`Fetching current price for ${cryptocurrency}`);
      // This is a placeholder implementation
      // In a real system, you would fetch this from your price feed service
      const latestPrice = await this.priceService.getAssetInfo(cryptocurrency);
      this.logger.debug('Price service response:', latestPrice);

      if (!latestPrice?.price) {
        this.logger.error(`No price data available for ${cryptocurrency}`, {
          response: latestPrice
        });
        throw new Error(`No price data available for ${cryptocurrency}`);
      }

      this.logger.debug(`Successfully retrieved price: ${latestPrice.price}`);
      return latestPrice.price;
    } catch (error) {
      this.logger.error('Error fetching current price', error.stack);
      throw new Error(`Failed to fetch price for ${cryptocurrency}: ${error.message}`);
    }
  }
}
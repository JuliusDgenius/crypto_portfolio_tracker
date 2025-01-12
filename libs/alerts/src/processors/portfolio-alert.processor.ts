import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/src';
import {
  PortfolioAlertCondition,
  ConditionEvaluationResult
} from '../interfaces/alert-conditions.interface';

@Injectable()
export class PortfolioAlertProcessor {
  private readonly logger = new Logger(PortfolioAlertProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates the conditions for a portfolio alert before it's created
   * Ensures the portfolio exists and metrics are valid
   */
  async validateConditions(conditions: PortfolioAlertCondition): Promise<boolean> {
    try {
      // Check if portfolio exists
      const portfolio = await this.prisma.portfolio.findUnique({
        where: { id: conditions.portfolioId }
      });

      if (!portfolio) {
        this.logger.warn(`Portfolio not found: ${conditions.portfolioId}`);
        return false;
      }

      // Validate threshold is positive
      if (conditions.threshold <= 0) {
        this.logger.warn(`Invalid threshold value: ${conditions.threshold}`);
        return false;
      }

      // Validate metric type
      const validMetricTypes = ['TOTAL_VALUE', 'DAILY_CHANGE', 'VOLATILITY'];
      if (!validMetricTypes.includes(conditions.metricType)) {
        this.logger.warn(`Invalid metric type: ${conditions.metricType}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error validating portfolio alert conditions', error.stack);
      return false;
    }
  }

  /**
   * Evaluates portfolio alert conditions against current portfolio data
   * Returns a result indicating whether the alert should be triggered
   */
  async evaluateConditions(conditions: PortfolioAlertCondition): Promise<ConditionEvaluationResult> {
    try {
      const currentValue = await this.getMetricValue(conditions);

      return {
        isTriggered: Math.abs(currentValue) >= conditions.threshold,
        currentValue,
        triggeredAt: new Date(),
        metadata: {
          portfolioId: conditions.portfolioId,
          metricType: conditions.metricType,
          threshold: conditions.threshold
        }
      };
    } catch (error) {
      this.logger.error('Error evaluating portfolio alert conditions', error.stack);
      return {
        isTriggered: false,
        triggeredAt: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Calculates the current value for the specified portfolio metric
   */
  private async getMetricValue(conditions: PortfolioAlertCondition): Promise<number> {
    switch (conditions.metricType) {
      case 'TOTAL_VALUE':
        return this.getPortfolioValue(conditions.portfolioId);
      case 'DAILY_CHANGE':
        return this.calculateDailyChange(conditions.portfolioId);
      case 'VOLATILITY':
        return this.calculateVolatility(conditions.portfolioId);
      default:
        throw new Error(`Unsupported metric type: ${conditions.metricType}`);
    }
  }

  /**
   * Fetches the current total value of a portfolio
   */
  private async getPortfolioValue(portfolioId: string): Promise<number> {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId }
    });

    if (!portfolio) {
      throw new Error(`Portfolio not found: ${portfolioId}`);
    }

    return portfolio.totalValue;
  }

  /**
   * Calculates the daily percentage change in portfolio value
   */
  private async calculateDailyChange(portfolioId: string): Promise<number> {
    const [todayValue, yesterdayValue] = await Promise.all([
      this.getPortfolioValue(portfolioId),
      this.getHistoricalValue(portfolioId, 1)
    ]);

    if (!yesterdayValue) {
      throw new Error('Insufficient historical data for daily change calculation');
    }

    return ((todayValue - yesterdayValue) / yesterdayValue) * 100;
  }

  /**
   * Calculates portfolio volatility over the past 30 days
   */
  private async calculateVolatility(portfolioId: string): Promise<number> {
    try {
      // Fetch last 30 days of historical data
      const historicalData = await this.prisma.historicalData.findMany({
        where: {
          portfolioId,
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { date: 'asc' }
      });

      if (historicalData.length < 2) {
        throw new Error('Insufficient historical data for volatility calculation');
      }

      // Calculate daily returns
      const returns = historicalData.slice(1).map((data, index) => {
        const previousValue = historicalData[index].totalValue;
        return (data.totalValue - previousValue) / previousValue;
      });

      // Calculate standard deviation of returns
      const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
      const variance = returns.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / returns.length;
      
      // Convert to percentage and annualize
      return Math.sqrt(variance) * Math.sqrt(365) * 100;
    } catch (error) {
      throw new Error(`Error calculating volatility: ${error.message}`);
    }
  }

  /**
   * Retrieves historical portfolio value for a specific number of days ago
   */
  private async getHistoricalValue(portfolioId: string, daysAgo: number): Promise<number | null> {
    const historicalData = await this.prisma.historicalData.findFirst({
      where: {
        portfolioId,
        date: {
          gte: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - (daysAgo - 1) * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { date: 'desc' }
    });

    return historicalData?.totalValue ?? null;
  }
}
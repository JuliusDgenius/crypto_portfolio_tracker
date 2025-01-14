import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/src';
import { HistoricalDataService } from './historial.service'; 
@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private readonly historicalDataService: HistoricalDataService,
  ) {}

  async calculateProfitLoss(portfolioId: string) {
    const [dayAgo, weekAgo, monthAgo, yearAgo] = this.getHistoricalDates();

    const currentValue = await this.getCurrentPortfolioValue(portfolioId);
    const initialValue = await this.getInitialPortfolioValue(portfolioId);

    const [dayData, weekData, monthData, yearData] = await Promise.all([
      this.historicalDataService.getHistoricalValue(portfolioId, dayAgo),
      this.historicalDataService.getHistoricalValue(portfolioId, weekAgo),
      this.historicalDataService.getHistoricalValue(portfolioId, monthAgo),
      this.historicalDataService.getHistoricalValue(portfolioId, yearAgo),
    ]);

    return {
      day: this.calculatePercentageChange(dayData?.totalValue, currentValue),
      week: this.calculatePercentageChange(weekData?.totalValue, currentValue),
      month: this.calculatePercentageChange(monthData?.totalValue, currentValue),
      year: this.calculatePercentageChange(yearData?.totalValue, currentValue),
      allTime: this.calculatePercentageChange(initialValue, currentValue),
    };
  }

    /**
   * Calculates performance metrics for a portfolio
   */
    async calculatePerformanceMetrics(portfolioId: string) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
      const historicalData = await this.historicalDataService.getPortfolioHistory(
        portfolioId,
        thirtyDaysAgo,
        new Date(),
        'daily'
      );
  
      if (historicalData.length < 2) {
        return {
          change: 0,
          percentageChange: 0,
        };
      }
  
      const firstValue = historicalData[0].totalValue;
      const lastValue = historicalData[historicalData.length - 1].totalValue;
  
      return {
        change: lastValue - firstValue,
        percentageChange: ((lastValue - firstValue) / firstValue) * 100,
      };
    }

  private getHistoricalDates() {
    const now = new Date();
    return [
      new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
      new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
      new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
    ];
  }

  private async getCurrentPortfolioValue(portfolioId: string): Promise<number> {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: { totalValue: true },
    });
    return portfolio.totalValue;
  }

  private async getInitialPortfolioValue(portfolioId: string): Promise<number> {
    const firstTransaction = await this.prisma.transaction.findFirst({
      where: { portfolioId },
      orderBy: { date: 'asc' },
    });
    return firstTransaction ? firstTransaction.amount * firstTransaction.pricePerUnit : 0;
  }

  private calculatePercentageChange(
    initialValue: number | undefined,
    currentValue: number,
  ): number {
    if (!initialValue) return 0;
    return ((currentValue - initialValue) / initialValue) * 100;
  }
}
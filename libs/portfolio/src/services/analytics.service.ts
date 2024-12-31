// libs/portfolio/src/services/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/src';
import { PerformanceMetrics } from 'src/types/portfolio.types';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async calculateProfitLoss(portfolioId: string) {
    const [dayAgo, weekAgo, monthAgo, yearAgo] = this.getHistoricalDates();

    const [dayData, weekData, monthData, yearData] = await Promise.all([
      this.getHistoricalValue(portfolioId, dayAgo),
      this.getHistoricalValue(portfolioId, weekAgo),
      this.getHistoricalValue(portfolioId, monthAgo),
      this.getHistoricalValue(portfolioId, yearAgo),
    ]);

    const currentValue = await this.getCurrentPortfolioValue(portfolioId);
    const initialValue = await this.getInitialPortfolioValue(portfolioId);

    return {
      day: this.calculatePercentageChange(dayData?.totalValue, currentValue),
      week: this.calculatePercentageChange(weekData?.totalValue, currentValue),
      month: this.calculatePercentageChange(monthData?.totalValue, currentValue),
      year: this.calculatePercentageChange(yearData?.totalValue, currentValue),
      allTime: this.calculatePercentageChange(initialValue, currentValue),
    };
  }

  async calculatePerformanceMetrics(portfolioId: string): Promise<PerformanceMetrics> {
    return
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

  private async getHistoricalValue(portfolioId: string, date: Date) {
    return this.prisma.historicalData.findFirst({
      where: {
        portfolioId,
        date: {
          gte: date,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
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
    return firstTransaction ? firstTransaction.amount * firstTransaction.price : 0;
  }

  private calculatePercentageChange(
    initialValue: number | undefined,
    currentValue: number,
  ): number {
    if (!initialValue) return 0;
    return ((currentValue - initialValue) / initialValue) * 100;
  }
}
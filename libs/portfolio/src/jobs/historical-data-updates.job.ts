import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../database/src';
import { HistoricalDataService } from '../services';

@Injectable()
export class HistoricalDataUpdateJob {
    private readonly logger = new Logger(HistoricalDataService.name);

  constructor(
    private prisma: PrismaService,
    private historicalDataService: HistoricalDataService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateHistoricalData() {
    try {
      // Get all active portfolios
      const portfolios = await this.prisma.portfolio.findMany({
        select: { id: true },
      });

      // Update historical data for each portfolio
      for (const portfolio of portfolios) {
        await this.historicalDataService.updatePortfolioHistory(portfolio.id);
      }

      this.logger.log(
        'Historical data updated successfully for all portfolios',
        'HistoricalDataUpdateJob',
      );
    } catch (error) {
      this.logger.error(
        'Error updating historical data',
        error.stack,
        'HistoricalDataUpdateJob',
      );
    }
  }
}
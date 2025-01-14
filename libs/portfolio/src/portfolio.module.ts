// libs/portfolio/src/portfolio.module.ts
import { Module } from '@nestjs/common';
import { PortfolioService, TransactionService, AnalyticsService, HistoricalDataService } from './services';
import { DatabaseModule } from '../../database/src';
import { PortfolioController, TransactionController } from './controllers';
import { HistoricalDataUpdateJob } from './jobs/historical-data-updates.job';

@Module({
  imports: [DatabaseModule],
  controllers: [PortfolioController, TransactionController],
  providers: [
    PortfolioService,
    TransactionService,
    AnalyticsService,
    HistoricalDataService,
    HistoricalDataUpdateJob
  ],
  exports: [PortfolioService, TransactionService, AnalyticsService],
})
export class PortfolioModule {}
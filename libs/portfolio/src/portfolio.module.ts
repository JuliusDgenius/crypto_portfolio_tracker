import { Module } from '@nestjs/common';
import { PortfolioService, TransactionService, AnalyticsService, HistoricalDataService } from './services';
import { DatabaseModule } from '../../database/src';
import { PortfolioController, TransactionController, HistoricalDataController } from './controllers';
import { HistoricalDataUpdateJob } from './jobs';

@Module({
  imports: [DatabaseModule],
  controllers: [PortfolioController, TransactionController, HistoricalDataController],
  providers: [
    PortfolioService,
    TransactionService,
    AnalyticsService,
    HistoricalDataService,
    HistoricalDataUpdateJob
  ],
  exports: [PortfolioService, TransactionService, AnalyticsService, HistoricalDataService],
})
export class PortfolioModule {}
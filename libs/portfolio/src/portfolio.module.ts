import { Module } from '@nestjs/common';
import { PortfolioService, TransactionService, AnalyticsService, HistoricalDataService, CsvService } from './services';
import { DatabaseModule } from '../../database/src';
import { PortfolioController, TransactionController, HistoricalDataController, CsvController } from './controllers';
import { HistoricalDataUpdateJob } from './jobs';

@Module({
  imports: [DatabaseModule],
  controllers: [PortfolioController, TransactionController, HistoricalDataController, CsvController],
  providers: [
    PortfolioService,
    TransactionService,
    AnalyticsService,
    HistoricalDataService,
    CsvService,
    HistoricalDataUpdateJob
  ],
  exports: [PortfolioService, TransactionService, AnalyticsService, HistoricalDataService, CsvService],
})
export class PortfolioModule {}
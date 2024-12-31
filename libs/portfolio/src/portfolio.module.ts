// libs/portfolio/src/portfolio.module.ts
import { Module } from '@nestjs/common';
import { PortfolioService } from './services/portfolio.service';
import { TransactionService } from './services/transaction.service';
import { AnalyticsService } from './services/analytics.service';
import { DatabaseModule } from '../../database/src';
import { PortfolioController } from './controllers/portfolio.controller';
import { TransactionController } from './controllers/transaction.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [PortfolioController, TransactionController],
  providers: [PortfolioService, TransactionService, AnalyticsService],
  exports: [PortfolioService, TransactionService, AnalyticsService],
})
export class PortfolioModule {}
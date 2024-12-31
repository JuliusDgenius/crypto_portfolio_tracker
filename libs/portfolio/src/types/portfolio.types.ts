// libs/portfolio/src/types/portfolio.types.ts
import { TransactionType } from '@prisma/client';

// Define interfaces that match our Prisma schema
export interface ProfitLoss {
  day: number;
  week: number;
  month: number;
  year: number;
  allTime: number;
}

export interface PortfolioMetrics {
  totalValue: number;
  profitLoss: ProfitLoss;
  assetAllocation: AssetAllocation[];
  performance: PerformanceMetrics;
}

export interface AssetAllocation {
  symbol: string;
  percentage: number;
  value: number;
}

export interface PerformanceMetrics {
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  yearlyReturn: number;
}
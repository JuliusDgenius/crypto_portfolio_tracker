import { TransactionType } from '@prisma/client';

/**
 * @dev Represents the profit and loss for different time periods.
 */
export interface ProfitLoss {
  /** @dev Profit/Loss for the day. */
  day: number;
  /** @dev Profit/Loss for the week. */
  week: number;
  /** @dev Profit/Loss for the month. */
  month: number;
  /** @dev Profit/Loss for the year. */
  year: number;
  /** @dev Profit/Loss for all time. */
  allTime: number;
  twentyFourHour: number;
}

/**
 * @dev Represents the metrics for a portfolio.
 */
export interface PortfolioMetrics {
  /** @dev The total value of the portfolio. */
  totalValue: number;
  /** @dev The profit and loss of the portfolio. */
  profitLoss: ProfitLoss;
  /** @dev The asset allocation of the portfolio. */
  assetAllocation: AssetAllocation[];
  /** @dev The performance metrics of the portfolio. */
  performance: PerformanceMetrics;
}

/**
 * @dev Represents the allocation of a single asset in the portfolio.
 */
export interface AssetAllocation {
  /** @dev The symbol of the asset. */
  symbol: string;
  /** @dev The percentage of the portfolio allocated to the asset. */
  percentage: number;
  /** @dev The value of the asset in the portfolio. */
  value: number;
}

/**
 * @dev Represents the performance metrics of the portfolio.
 */
export interface PerformanceMetrics {
  /** @dev The absolute change in value. */
  change: number; // absolute value change
  /** @dev The percentage change in value. */
  percentageChange: number // % change
}
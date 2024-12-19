/**
 * Portfolio model interface
 */
export interface IPortfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  totalValue: number;
  profitLoss: ProfitLossMetrics;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfitLossMetrics {
  day: number;
  week: number;
  month: number;
  year: number;
  allTime: number;
} 
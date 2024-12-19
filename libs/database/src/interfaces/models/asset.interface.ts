/**
 * Asset model interface
 */
export interface IAsset {
  id: string;
  portfolioId: string;
  symbol: string;
  name: string;
  amount: number;
  averageBuyPrice: number;
  currentPrice: number;
  value: number;
  profitLoss: number;
  allocation: number;
  lastUpdated: Date;
} 
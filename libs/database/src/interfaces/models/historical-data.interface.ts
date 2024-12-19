/**
 * Historical data model interface
 */
export interface IHistoricalData {
  id: string;
  portfolioId: string;
  date: Date;
  totalValue: number;
  assets: HistoricalAsset[];
  createdAt: Date;
}

export interface HistoricalAsset {
  symbol: string;
  amount: number;
  price: number;
  value: number;
  allocation: number;
} 
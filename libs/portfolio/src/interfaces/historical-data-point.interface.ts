import { AssetSnapshot } from "./asset-snapshot.interface";

export interface HistoricalDataPoint {
    id: string;
    portfolioId: string;
    date: Date;
    totalValue: number;
    assets: AssetSnapshot[];
    createdAt: Date;
    updatedAt: Date;
  }
  
import { AssetSnapshot } from "../interfaces";

export class CreateHistoricalDataDto {
    portfolioId: string;
    date: Date;
    totalValue: number;
    assets: AssetSnapshot[];
  }
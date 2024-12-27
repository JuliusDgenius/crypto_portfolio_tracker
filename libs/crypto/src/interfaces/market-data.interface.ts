export interface IMarketData {
  symbol: string;
  name: string;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number;
  rank: number;
  lastUpdated: Date;
}
export interface IMarketSearchResult {
    symbol: string;
    name: string;
    price: number;
    marketCap: number;
    lastUpdate: Date;
  }
  
  export interface IMarketTrendingResult {
    symbol: string;
    name: string;
    price: number;
    marketCap: number;
    change24h: number;
    lastUpdated: Date;
  }
  
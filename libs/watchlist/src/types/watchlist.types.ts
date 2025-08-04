// types/watchlist.types.ts
export interface WatchlistAsset {
    id: string;
    symbol: string;
    name: string;
    currentPrice: number;
    addedAt?: Date;
  }
  
  export interface WatchlistMetrics {
    totalAssets: number;
    topPerformers: WatchlistAsset[];
    recentlyAdded: WatchlistAsset[];
    alerts: number;
  }
// types/watchlist.types.ts
export interface WatchlistAsset {
    symbol: string;
    name: string;
    currentPrice: number;
    addedAt: Date;
  }
  
  export interface WatchlistMetrics {
    totalAssets: number;
    topPerformers: WatchlistAsset[];
    recentlyAdded: WatchlistAsset[];
    alerts: number;
  }
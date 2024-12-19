/**
 * Watchlist model interface
 */
export interface IWatchlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  cryptocurrencies: WatchlistCrypto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WatchlistCrypto {
  symbol: string;
  name: string;
  addedAt: Date;
  priceAlert?: number;
} 
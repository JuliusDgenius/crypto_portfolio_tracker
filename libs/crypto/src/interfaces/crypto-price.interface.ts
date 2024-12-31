export interface ICryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
  lastUpdated: Date;
}

/**
 * Represents the current price and basic information for a cryptocurrency.
 * Used for the main price endpoint and real-time updates.
 */
export interface ICryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
  lastUpdated: Date;
}

/**
 * Represents a single historical price data point.
 * Used for charting and historical analysis.
 */
export interface IHistoricalPrice {
  timestamp: string;
  price: number;
  marketCap: number;
  volume?: number;
}

/**
 * Comprehensive market statistics for a cryptocurrency.
 * Includes supply information and all-time price records.
 */
export interface IMarketStats {
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number | null;
  allTimeHigh: IPricePoint;
  allTimeLow: IPricePoint;
  priceChange: {
    '1h': number;
    '24h': number;
    '7d': number;
    '30d': number;
  };
  marketCapRank: number;
}

/**
 * Represents a price point with its corresponding date.
 * Used for tracking significant price levels and historical records.
 */
interface IPricePoint {
  price: number;
  date: string;
}

/**
 * Configuration for a price alert.
 * Supports both upward and downward price movement alerts.
 */
export interface IPriceAlert {
  id: string;
  symbol: string;
  threshold: number;
  direction: 'above' | 'below';
  createdAt: Date;
  triggered: boolean;
  triggeredAt?: Date;
}

/**
 * Collection of technical indicators for price analysis.
 * Each indicator includes its current value and relevant parameters.
 */
export interface ITechnicalIndicator {
  name: string;
  value: number;
  timestamp: string;
  parameters: IndicatorParameters;
  signalType?: 'buy' | 'sell' | 'neutral';
}

/**
 * Parameters used for calculating technical indicators.
 * Different indicators may use different combinations of these parameters.
 */
interface IndicatorParameters {
  period?: number;
  source?: 'close' | 'high' | 'low' | 'open';
  weight?: number;
  standardDeviations?: number;
}

/**
 * Parameters for historical data queries.
 * Used to specify the time range and granularity of data.
 */
export interface IHistoricalDataParams {
  range: '1d' | '7d' | '30d' | '90d' | '1y';
  interval: '1h' | '4h' | '1d';
  symbol: string;
}

/**
 * Structure for price comparison results.
 * Maps symbols to their performance metrics over a given timeframe.
 */
export interface IPriceComparison {
  [symbol: string]: {
    startPrice: number;
    endPrice: number;
    percentageChange: number;
    highestPrice: number;
    lowestPrice: number;
    volatility: number;
  };
}
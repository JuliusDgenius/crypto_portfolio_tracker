// src/types/crypto.types.ts
/**
 * Time intervals for historical data
 */
export type TimeInterval = '1h' | '24h' | '7d' | '30d' | '1y';

/**
 * Price change information
 */
export type PriceChange = {
  interval: TimeInterval;
  percentage: number;
  absoluteChange: number;
};

/**
 * Supported fiat currencies for price conversion
 */
export type FiatCurrency = 'USD' | 'EUR' | 'GBP' | 'JPY';

/**
 * Market trend indicators
 */
export type MarketTrend = 'bullish' | 'bearish' | 'neutral';

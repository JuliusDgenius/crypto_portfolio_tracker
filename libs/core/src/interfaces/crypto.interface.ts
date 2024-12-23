// src/interfaces/crypto.interface.ts
import { IEntity } from './base.interface';

/**
 * Interface for historical price data points
 * @interface IPriceDataPoint
 */
export interface IPriceDataPoint {
  timestamp: Date;
  price: number;
  volume: number;
}

/**
 * Interface for market statistics
 * @interface IMarketStats
 */
export interface IMarketStats {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  totalCryptocurrencies: number;
  lastUpdated: Date;
}

/**
 * Interface for cryptocurrency price alerts
 * @interface IPriceAlert
 * @extends {IEntity}
 */
export interface IPriceAlert extends IEntity {
  userId: string;
  cryptoAssetId: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isTriggered: boolean;
  isActive: boolean;
}
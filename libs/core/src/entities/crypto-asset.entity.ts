// src/entities/crypto-asset.entity.ts
import { BaseEntity } from '../base/base.entity';
import { IAuditableEntity } from '../interfaces/base.interface';

/**
 * Entity representing a cryptocurrency asset
 * @class CryptoAsset
 * @extends {BaseEntity}
 * @implements {IAuditableEntity}
 */
export class CryptoAsset extends BaseEntity implements IAuditableEntity {
  /** Unique identifier from the cryptocurrency API (e.g., 'bitcoin') */
  coinId: string;

  /** Trading symbol (e.g., 'BTC') */
  symbol: string;

  /** Full name of the cryptocurrency */
  name: string;

  /** Current price in USD */
  currentPrice: number;

  /** 24-hour price change percentage */
  priceChangePercentage24h: number;

  /** Current market capitalization in USD */
  marketCap: number;

  /** Total circulating supply */
  circulatingSupply: number;

  /** Maximum supply (if applicable) */
  maxSupply?: number;

  /** Last price update timestamp */
  lastPriceUpdate: Date;

  /** Trading volume in the last 24 hours */
  volume24h: number;

  /** All-time high price */
  athPrice: number;

  /** All-time high date */
  athDate: Date;

  /** User who created the entry */
  createdBy?: string;

  /** User who last updated the entry */
  updatedBy?: string;

  constructor(partial: Partial<CryptoAsset>) {
    super(partial);
  }

  /**
   * Calculates the market dominance percentage
   * @param {number} totalMarketCap - Total cryptocurrency market capitalization
   * @returns {number} - Market dominance percentage
   */
  getMarketDominance(totalMarketCap: number): number {
    return (this.marketCap / totalMarketCap) * 100;
  }

  /**
   * Calculates the percentage from all-time high
   * @returns {number} - Percentage from ATH
   */
  getPercentageFromATH(): number {
    return ((this.currentPrice - this.athPrice) / this.athPrice) * 100;
  }
}
/**
 * Response structure from the price API.
 * Maps coin IDs to their current price data.
 */
export interface IPriceResponse {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
  };
}
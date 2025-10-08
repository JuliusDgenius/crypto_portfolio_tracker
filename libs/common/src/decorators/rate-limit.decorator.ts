import { SetMetadata } from '@nestjs/common';
export const RATE_LIMIT_KEY = 'rateLimit';
export const NO_RATE_LIMIT = 'noRateLimit';

export interface RateLimitOptions {
  key: string;
  rule?: { points: number; duration: number };
}

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

export const SkipRateLimit = () => SetMetadata(NO_RATE_LIMIT, true);

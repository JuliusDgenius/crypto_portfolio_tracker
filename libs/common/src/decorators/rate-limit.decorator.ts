import { SetMetadata } from '@nestjs/common';
export const RATE_LIMIT_KEY = 'rateLimit';
export const RateLimit = (
    key: string, 
    rule?: { points: number; duration: number }
) =>
  SetMetadata(RATE_LIMIT_KEY, { key, rule });
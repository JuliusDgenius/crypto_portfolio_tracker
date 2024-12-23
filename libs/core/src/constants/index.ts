// libs/core/src/constants/index.ts
// Application-wide constants
export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 20,
  SORT_ORDER: 'desc' as const,
};

export const AUTH_CONSTANTS = {
  PASSWORD_MIN_LENGTH: 8,
  TOKEN_EXPIRY: '24h',
  REFRESH_TOKEN_EXPIRY: '7d',
};
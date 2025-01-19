export const ENDPOINTS = {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      PROFILE: '/auth/profile',
      ENABLE_2FA: '/auth/2fa/enable',
      VERIFY_2FA: '/auth/2fa/verify',
    },
    PORTFOLIO: {
      BASE: '/portfolios',
      DETAIL: (id: string) => `/portfolios/${id}`,
      TRANSACTIONS: (id: string) => `/portfolios/${id}/transactions`,
      METRICS: (id: string) => `/portfolios/${id}/metrics`,
    },
    MARKET: {
      PRICES: '/market/prices',
      SEARCH: '/market/search',
      DETAILS: (symbol: string) => `/market/details/${symbol}`,
    },
  } as const;
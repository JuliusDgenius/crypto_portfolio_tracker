export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    TIMEOUT: 30000,
    CREDENTIALS: 'include' as const,
    HEADERS: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };
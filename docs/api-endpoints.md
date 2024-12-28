# API Endpoints Documentation

## Base URL
`http://localhost:3000/api`

## Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Authentication Endpoints

### POST /auth/register
Register a new user account.
```typescript
Request:
{
  email: string,
  password: string,
  username: string
}

Response: {
  user: User,
  token: string
}
```

### POST /auth/login
Authenticate user and receive JWT token.
```typescript
Request:
{
  email: string,
  password: string,
  twoFactorToken?: string
}

Response: {
  user: User,
  token: string
}
```

### POST /auth/verify-email
Verify user's email address.
```typescript
Request:
{
  token: string
}

Response: {
  verified: boolean
}
```

### POST /auth/refresh
Refresh JWT token.
```typescript
Request: {
  refreshToken: string
}

Response: {
  token: string
}
```

## Portfolio Endpoints

### GET /portfolio
Get user's portfolios summary.
```typescript
Response: {
  portfolios: Portfolio[],
  totalValue: number,
  totalProfitLoss: ProfitLoss
}
```

### GET /portfolio/:id
Get specific portfolio details.
```typescript
Response: {
  portfolio: Portfolio,
  assets: Asset[],
  metrics: PortfolioMetrics
}
```

### POST /portfolio
Create new portfolio.
```typescript
Request: {
  name: string,
  description?: string
}

Response: {
  portfolio: Portfolio
}
```

### PUT /portfolio/:id
Update portfolio details.
```typescript
Request: {
  name?: string,
  description?: string
}

Response: {
  portfolio: Portfolio
}
```

### POST /portfolio/:id/transaction
Add new transaction to portfolio.
```typescript
Request: {
  type: TransactionType,
  cryptocurrency: string,
  amount: number,
  price: number,
  fee?: number,
  exchange?: string,
  wallet?: string,
  notes?: string,
  date: string // ISO date
}

Response: {
  transaction: Transaction,
  portfolio: Portfolio
}
```

### GET /portfolio/:id/history
Get portfolio historical data.
```typescript
Query Parameters:
- timeframe: '24h' | '7d' | '30d' | '90d' | '1y' | 'all'
- interval: '1h' | '1d' | '1w'

Response: {
  history: HistoricalData[],
  metrics: {
    startValue: number,
    endValue: number,
    percentageChange: number
  }
}
```

## Market Data Endpoints

### Get /market/{symbol}
Get market data for a specific cryptocurrency
```typescript
Query Parameters:
- symbol: string // e.g bitcoin, ethereum

Response: {
  prices: {
    [symbol: string]: {
      price: number,
      change24h: number,
      volume24h: number
    }
  }
}
```

### GET /market/prices
Get current cryptocurrency prices.
```typescript
Query Parameters:
- symbols: string[] // Comma-separated list
- currency?: string // Default: USD

Response: {
  prices: {
    [symbol: string]: {
      price: number,
      change24h: number,
      volume24h: number
    }
  }
}
```

### GET /market/search
Search cryptocurrencies.
```typescript
Query Parameters:
- query: string
- limit?: number // Default: 10

Response: {
  results: {
    symbol: string,
    name: string,
    price: number,
    marketCap: number
  }[]
}
```

### GET /market/trending
Get trending cryptocurrencies.
```typescript
Response: {
  trending: {
    symbol: string,
    name: string,
    price: number,
    change24h: number
  }[]
}
```

## Alert Endpoints

### GET /alerts
Get user's price alerts.
```typescript
Response: {
  alerts: Alert[]
}
```

### POST /alerts
Create new price alert.
```typescript
Request: {
  type: AlertType,
  conditions: {
    cryptocurrency?: string,
    price?: number,
    comparison: 'ABOVE' | 'BELOW',
    portfolioValue?: number,
    percentageChange?: number
  },
  notification: {
    email: boolean,
    push: boolean,
    sms: boolean
  }
}

Response: {
  alert: Alert
}
```

## Common Response Formats

### Error Response
```typescript
{
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### Pagination Response
```typescript
{
  data: T[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    hasMore: boolean
  }
}
```

## Rate Limiting
- Public endpoints: 100 requests per minute
- Authenticated endpoints: 1000 requests per minute
- Market data endpoints: 500 requests per minute

## Websocket Endpoints
```typescript
ws://api.cryptofolio.com/v1/ws

Events:
- price_update: Real-time price updates
- portfolio_update: Portfolio value updates
- alert_triggered: Alert notifications
```
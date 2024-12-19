# Data Models

## Schema

model User {
  id              String           @id @default(uuid())
  email           String           @unique
  password        String
  username        String           @unique
  verified        Boolean          @default(false)
  profilePicture  String?
  twoFactorEnabled Boolean         @default(false)
  preferences     Json             // Stores currency, theme, notifications
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  portfolios      Portfolio[]
  watchlists      Watchlist[]
  exchangeAccounts ExchangeAccount[]
  alerts          Alert[]
}

model Portfolio {
  id          String        @id @default(uuid())
  userId      String
  name        String
  description String?
  totalValue  Float
  profitLoss  Json         // Stores day, week, month, year, allTime
  lastUpdated DateTime
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  user        User         @relation(fields: [userId], references: [id])
  transactions Transaction[]
  assets      Asset[]
  historicalData HistoricalData[]
}

model Transaction {
  id            String    @id @default(uuid())
  portfolioId   String
  type          TransactionType
  cryptocurrency String
  amount        Float
  price         Float
  fee           Float?
  exchange      String?
  wallet        String?
  notes         String?
  date          DateTime
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  portfolio     Portfolio @relation(fields: [portfolioId], references: [id])
}

model Asset {
  id              String    @id @default(uuid())
  portfolioId     String
  symbol          String
  name            String
  amount          Float
  averageBuyPrice Float
  currentPrice    Float
  value           Float
  profitLoss      Float
  allocation      Float    // Percentage of portfolio
  lastUpdated     DateTime
  portfolio       Portfolio @relation(fields: [portfolioId], references: [id])

  @@index([portfolioId, symbol])
}

model Watchlist {
  id             String    @id @default(uuid())
  userId         String
  name           String
  description    String?
  cryptocurrencies Json    // Array of crypto objects with symbol, name, addedAt, priceAlert
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  user           User      @relation(fields: [userId], references: [id])
}

model ExchangeAccount {
  id          String    @id @default(uuid())
  userId      String
  exchange    String
  name        String
  apiKey      String
  apiSecret   String
  isActive    Boolean   @default(true)
  lastSync    DateTime
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  user        User      @relation(fields: [userId], references: [id])
}

model Alert {
  id            String      @id @default(uuid())
  userId        String
  type          AlertType
  status        AlertStatus
  conditions    Json        // Stores cryptocurrency, price, comparison, portfolioValue, percentageChange
  notification  Json        // Stores email, push, sms flags
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  lastTriggered DateTime?
  user          User        @relation(fields: [userId], references: [id])
}

model HistoricalData {
  id          String    @id @default(uuid())
  portfolioId String
  date        DateTime
  totalValue  Float
  assets      Json      // Array of asset snapshots
  createdAt   DateTime  @default(now())
  portfolio   Portfolio @relation(fields: [portfolioId], references: [id])

  @@index([portfolioId, date])
}

enum TransactionType {
  BUY
  SELL
  TRANSFER_IN
  TRANSFER_OUT
}

enum AlertType {
  PRICE
  PORTFOLIO
  SYSTEM
}

enum AlertStatus {
  ACTIVE
  TRIGGERED
  DISABLED
}

## Notes
- All models include timestamps (`createdAt` and `updatedAt`)
- IDs use UUID instead of MongoDB ObjectId
- Optional fields are marked with `?`
- Complex objects (like preferences, profitLoss) are stored as Json
- Relations are explicitly defined using Prisma's relation syntax
- Indexes are defined using `@@index`
- Sensitive data (like API keys) should still be encrypted before storage

## Indexes
- User: email (unique), username (unique)
- Asset: [portfolioId, symbol]
- HistoricalData: [portfolioId, date]

## Relationships
- User -> Portfolio (1:Many)
- Portfolio -> Transaction (1:Many)
- Portfolio -> Asset (1:Many)
- User -> Watchlist (1:Many)
- User -> ExchangeAccount (1:Many)
- User -> Alert (1:Many)
- Portfolio -> HistoricalData (1:Many)



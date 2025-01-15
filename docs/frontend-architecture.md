# Frontend Architecture
apps/
  frontend/
    src/
      assets/
        icons/
        images/
      components/
        common/
          Button/
          Card/
          Input/
          Loading/
          Modal/
          Table/
        charts/
          AreaChart/
          BarChart/
          LineChart/
          PieChart/
        layout/
          Header/
          Sidebar/
          Footer/
          MainLayout/
        portfolio/
          PortfolioSummary/
          AssetAllocation/
          TransactionHistory/
          PerformanceMetrics/
        watchlist/
          WatchlistTable/
          PriceAlerts/
      contexts/
        AuthContext/
        ThemeContext/
        PortfolioContext/
      features/
        auth/
          components/
          hooks/
          services/
          types/
        portfolio/
          components/
          hooks/
          services/
          types/
        watchlist/
          components/
          hooks/
          services/
          types/
      hooks/
        useApi/
        useWebSocket/
        usePortfolio/
        useAuth/
      services/
        api/
        websocket/
        storage/
      store/
        slices/
        hooks/
      styles/
        tailwind/
      types/
      utils/
        formatters/
        validators/
      App.tsx
      main.tsx
    index.html
    tailwind.config.js
    vite.config.ts
    tsconfig.json

## Core Architecture

### Application Layers
1. **Presentation Layer**
   - React Components
   - UI/UX Elements
   - Styling (TailwindCSS)

2. **State Management Layer**
   - Context Providers
   - Custom Hooks
   - Local State

3. **Data Access Layer**
   - API Integration
   - WebSocket Connections
   - Local Storage

4. **Service Layer**
   - Authentication
   - Real-time Updates
   - Data Transformation
   - Error Handling

## Component Architecture

### Core Components
1. **Layout Components**
   ```tsx
   - AppLayout
     ├── Navbar
     ├── Sidebar
     └── Footer
   ```

2. **Authentication Components**
   ```tsx
   - AuthProvider
     ├── LoginForm
     ├── RegisterForm
     ├── PasswordReset
     └── EmailVerification
   ```

3. **Portfolio Components**
   ```tsx
   - PortfolioProvider
     ├── PortfolioDashboard
     │   ├── PortfolioSummary
     │   └── QuickActions
     ├── PortfolioChart
     │   ├── ChartControls
     │   └── TimeframeSelector
     ├── AssetAllocation
     │   ├── AllocationChart
     │   └── AssetBreakdown
     └── TransactionHistory
         ├── TransactionList
         └── TransactionForm
   ```

4. **Market Components**
   ```tsx
   - MarketProvider
     ├── PriceTable
     │   ├── PriceRow
     │   └── PriceControls
     ├── CryptoSearch
     │   ├── SearchBar
     │   └── SearchResults
     └── MarketStats
         ├── GlobalStats
         └── TrendingCoins
   ```

## State Management

### Authentication Context
```typescript
interface AuthContext {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;

  // Auth Methods
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  
  // Profile Methods
  updateProfile: (data: Partial<User>) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<void>;
  
  // Security Methods
  enable2FA: () => Promise<{ qrCode: string }>;
  verify2FA: (token: string) => Promise<void>;
  
  // Session Methods
  refreshToken: () => Promise<void>;
  clearError: () => void;
}
```

### Portfolio Context
```typescript
interface PortfolioContext {
  // State
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
  isLoading: boolean;
  error: Error | null;

  // Portfolio Methods
  createPortfolio: (data: PortfolioData) => Promise<void>;
  updatePortfolio: (id: string, data: Partial<Portfolio>) => Promise<void>;
  deletePortfolio: (id: string) => Promise<void>;
  
  // Transaction Methods
  addTransaction: (data: TransactionData) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  
  // Analysis Methods
  calculateMetrics: () => PortfolioMetrics;
  exportData: (format: 'csv' | 'pdf') => Promise<void>;
}
```

## Custom Hooks

### Data Hooks
```typescript
const usePortfolio = (portfolioId: string) => {
  // Portfolio-specific state and methods
}

const useCryptoPrice = (symbol: string) => {
  // Real-time price tracking
}

const useMarketData = (symbols: string[]) => {
  // Market data and websocket connection
}
```

### Utility Hooks
```typescript
const useTheme = () => {
  // Theme management
}

const useWebSocket = (url: string) => {
  // WebSocket connection management
}

const useLocalStorage = (key: string) => {
  // Local storage management
}
```

## API Integration

### API Client
```typescript
const apiClient = {
  // Base Methods
  get: <T>(url: string) => Promise<T>,
  post: <T>(url: string, data: any) => Promise<T>,
  put: <T>(url: string, data: any) => Promise<T>,
  delete: <T>(url: string) => Promise<T>,

  // Interceptors
  requestInterceptor: (config: AxiosConfig) => config,
  responseInterceptor: (response: AxiosResponse) => response,
  errorInterceptor: (error: AxiosError) => Promise.reject(error)
}
```

## Testing Strategy

### Unit Testing
- Component testing with React Testing Library
- Hook testing with @testing-library/react-hooks
- Context testing with custom providers

### Integration Testing
- API integration tests
- Component interaction tests
- State management tests

### E2E Testing
- Critical user flows
- Authentication flows
- Portfolio management flows

## Error Handling

### Error Boundaries
- Root error boundary
- Feature-specific boundaries
- Fallback components

### API Error Handling
- Request/response interceptors
- Error classification
- User-friendly error messages

## Performance Optimization

### Code Splitting
- Route-based splitting
- Component lazy loading
- Dynamic imports

### Caching Strategy
- API response caching
- Local storage usage
- Memory caching

### Rendering Optimization
- Memoization (useMemo, useCallback)
- Virtual lists for large datasets
- Debounced/throttled updates

## Data Visualization

### Chart Components
```tsx
- ChartProvider
  ├── PriceChart
  │   ├── LineChart
  │   ├── CandlestickChart
  │   └── ChartControls
  ├── PortfolioChart
  │   ├── AreaChart
  │   ├── PieChart
  │   └── ChartControls
  └── PerformanceChart
      ├── BarChart
      ├── ComparisonChart
      └── ChartControls
```

### Chart Context
```typescript
interface ChartContext {
  // State
  timeframe: Timeframe;
  interval: Interval;
  chartType: ChartType;
  isLoading: boolean;
  error: Error | null;

  // Chart Methods
  setTimeframe: (timeframe: Timeframe) => void;
  setInterval: (interval: Interval) => void;
  setChartType: (type: ChartType) => void;
  
  // Data Methods
  fetchChartData: (options: ChartDataOptions) => Promise<void>;
  updateChartData: (data: ChartData) => void;
  
  // Customization Methods
  updateChartOptions: (options: ChartOptions) => void;
  toggleIndicator: (indicator: TechnicalIndicator) => void;
}
```

### Chart Hooks
```typescript
const useChartData = (options: ChartDataOptions) => {
  // Chart data management and real-time updates
}

const useChartConfig = (type: ChartType) => {
  // Chart.js configuration and options
}

const useChartInteraction = () => {
  // Chart interaction handlers and tooltips
}
```

### Chart Types
```typescript
type ChartType = 'line' | 'candlestick' | 'area' | 'pie' | 'bar';

interface ChartDataOptions {
  type: ChartType;
  timeframe: Timeframe;
  interval: Interval;
  indicators?: TechnicalIndicator[];
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
  metadata?: any;
}
```

### Chart Configurations
```typescript
const chartConfigs = {
  line: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      tooltip: {
        enabled: true,
        // ... tooltip configuration
      },
      legend: {
        // ... legend configuration
      }
    },
    scales: {
      // ... scales configuration
    }
  },
  // ... other chart type configurations
}
```

### Technical Indicators
```typescript
type TechnicalIndicator = 
  | 'MA' // Moving Average
  | 'EMA' // Exponential Moving Average
  | 'RSI' // Relative Strength Index
  | 'MACD' // Moving Average Convergence Divergence
  | 'BB'; // Bollinger Bands

interface IndicatorConfig {
  type: TechnicalIndicator;
  params: Record<string, number>;
  visible: boolean;
}
```

# Detailed Implementation Guide - Crypto Portfolio Tracker

## Core Library (libs/core)

The core library serves as the foundation of the application, containing essential business logic and shared types that other libraries depend on.

### Base Entities and Interfaces
Core entities should be defined in `libs/core/src/entities`:
```typescript
// base.entity.ts
export abstract class BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// user.entity.ts
export class UserEntity extends BaseEntity {
  email: string;
  hashedPassword: string;
  isEmailVerified: boolean;
  role: UserRole;
}

// crypto-asset.entity.ts
export class CryptoAssetEntity extends BaseEntity {
  symbol: string;
  name: string;
  currentPrice: number;
  lastUpdated: Date;
}
```

### Core Types and Interfaces
Located in `libs/core/src/types` and `libs/core/src/interfaces`:
```typescript
// common.types.ts
export type Pagination = {
  page: number;
  limit: number;
  total: number;
};

// repository.interface.ts
export interface IBaseRepository<T> {
  findById(id: string): Promise<T>;
  findAll(filters: any): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}
```

### User Management
The user module in `libs/core/src/user` handles user-related business logic:
```typescript
// services/password.service.ts
export class PasswordService {
  async hash(password: string): Promise<string>;
  async verify(password: string, hash: string): Promise<boolean>;
}

// repositories/user.repository.ts
export class UserRepository implements IBaseRepository<UserEntity> {
  // Implementation of base repository methods
  async findByEmail(email: string): Promise<UserEntity>;
  async updatePassword(userId: string, hashedPassword: string): Promise<void>;
}
```

## Database Library (libs/database)

The database library manages all database interactions and provides a clean interface for other libraries.

### Prisma Service
In `libs/database/src/prisma.service.ts`:
```typescript
@Injectable()
export class PrismaService extends PrismaClient {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
```

### Health Service
In `libs/database/src/health.service.ts`:
```typescript
@Injectable()
export class DatabaseHealthService {
  constructor(private prisma: PrismaService) {}

  async checkHealth(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

## Auth Library (libs/auth)

The auth library handles all authentication and authorization concerns.

### JWT Strategies
In `libs/auth/src/strategies`:
```typescript
// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<UserEntity> {
    return this.userService.findById(payload.sub);
  }
}
```

### Guards and Decorators
```typescript
// guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}

// decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

## Common Library (libs/common)

The common library provides shared utilities and middleware used across the application.

### Exception Handling
In `libs/common/src/filters`:
```typescript
// all-exceptions.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception instanceof Error ? exception.message : 'Internal server error',
    };

    this.logger.error('Exception occurred', {
      exception,
      request: {
        url: request.url,
        method: request.method,
        body: request.body,
      },
    });

    response.status(status).json(errorResponse);
  }
}
```

### Logging System
In `libs/common/src/logging`:
```typescript
// winston-config.service.ts
@Injectable()
export class WinstonConfigService {
  createWinstonOptions(): WinstonModuleOptions {
    return {
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    };
  }
}
```

### Email Service
In `libs/common/src/email`:
```typescript
// email.service.ts
@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly templateService: EmailTemplateService,
  ) {}

  async sendVerificationEmail(user: UserEntity, token: string): Promise<void> {
    const template = await this.templateService.compileTemplate(
      'verification',
      { user, token }
    );
    
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Verify Your Email',
      html: template,
    });
  }
}
```

## Config Library (libs/config)

The config library centralizes all configuration management.

### Configuration Service
In `libs/config/src/config.service.ts`:
```typescript
@Injectable()
export class ConfigService {
  constructor(
    @Inject(CONFIG_OPTIONS)
    private options: ConfigOptions,
  ) {}

  get(key: string): string {
    const value = process.env[key];
    if (!value && this.options.required.includes(key)) {
      throw new Error(`Missing required config key: ${key}`);
    }
    return value;
  }

  getNumber(key: string): number {
    const value = this.get(key);
    return Number(value);
  }

  getBoolean(key: string): boolean {
    const value = this.get(key);
    return value === 'true';
  }
}
```

## Portfolio Library (libs/portfolio)

The portfolio library handles all portfolio-related functionality.

### Portfolio Management
```typescript
// services/portfolio.service.ts
@Injectable()
export class PortfolioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  async calculatePortfolioValue(userId: string): Promise<number> {
    const holdings = await this.prisma.holding.findMany({
      where: { userId },
      include: { asset: true },
    });

    return holdings.reduce((total, holding) => {
      return total + (holding.quantity * holding.asset.currentPrice);
    }, 0);
  }

  async getPortfolioHistory(
    userId: string,
    timeframe: TimeFrame,
  ): Promise<PortfolioSnapshot[]> {
    // Implementation for historical portfolio value
  }
}
```

## Crypto Library (libs/crypto)

The crypto library handles all cryptocurrency data and market interactions.

### Price Service
```typescript
// services/price.service.ts
@Injectable()
export class PriceService {
  constructor(
    private readonly httpService: HttpService,
    private readonly cacheManager: Cache,
  ) {}

  async getCurrentPrice(symbol: string): Promise<number> {
    const cacheKey = `price:${symbol}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      return cached as number;
    }

    const price = await this.fetchPriceFromAPI(symbol);
    await this.cacheManager.set(cacheKey, price, 60); // Cache for 60 seconds
    
    return price;
  }
}

// services/market.service.ts
@Injectable()
export class MarketService {
  async getMarketData(
    symbols: string[],
    timeframe: TimeFrame,
  ): Promise<MarketData[]> {
    // Implementation for fetching market data
  }
}
```

## Frontend Application Structure

The frontend application should be organized to mirror the backend's separation of concerns:

### Core State Management
In `apps/frontend/src/app/store`:
```typescript
// auth.store.ts
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (credentials) => {
    // Implementation
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));

// portfolio.store.ts
export const usePortfolioStore = create<PortfolioStore>((set) => ({
  assets: [],
  totalValue: 0,
  fetchPortfolio: async () => {
    // Implementation
  },
}));
```

### Feature Components
In `apps/frontend/src/app/components/features`:
```typescript
// portfolio/PortfolioSummary.tsx
export const PortfolioSummary: React.FC = () => {
  const { totalValue, assets } = usePortfolioStore();
  
  return (
    <div className="grid gap-4">
      <TotalValue value={totalValue} />
      <AssetDistribution assets={assets} />
      <PerformanceMetrics assets={assets} />
    </div>
  );
};
```

This implementation guide ensures:
1. Clear separation of concerns between libraries
2. Consistent patterns across the application
3. Type safety and proper error handling
4. Scalable and maintainable code structure
5. Efficient data flow and state management

Would you like me to elaborate on any specific part of the implementation?
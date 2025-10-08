import { DynamicModule, Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { REDIS_OPTIONS } from './redis.constants';
import { RedisOptions } from './interfaces/redis-options.interface';
import { RateLimitService } from './rate-limiter.service';

@Global()
@Module({})
export class RedisModule {
  static forRoot(options: RedisOptions): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: REDIS_OPTIONS,
          useValue: options,
        },
        RedisService,
        RateLimitService,
      ],
      exports: [
        RedisService,
        RateLimitService,
      ],
      global: true,
    };
  }
}
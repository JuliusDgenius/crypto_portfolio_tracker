// libs/database/src/redis/redis.service.ts
import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { REDIS_OPTIONS } from './redis.constants';
import { RedisOptions } from './interfaces/redis-options.interface';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(@Inject(REDIS_OPTIONS) private readonly options: RedisOptions) {
    this.client = new Redis(options);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(
    key: string,
    value: string,
    mode?: string,
    duration?: number,
  ): Promise<void> {
    if (mode && duration) {
      await this.client.set(key, value, mode, duration);
    } else {
      await this.client.set(key, value);
    }
  }

  pipeline(): Redis.Pipeline {
    return this.client.pipeline();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
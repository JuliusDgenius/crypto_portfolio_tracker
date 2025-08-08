import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import { REDIS_OPTIONS } from './redis.constants';
import { RedisOptions } from './interfaces';
import { Redis, ChainableCommander } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject(REDIS_OPTIONS) private readonly options: RedisOptions
  ) {
    const optionsConfig: RedisOptions = {
      host: process.env.REDIS_HOST,
      port: +(process.env.REDIS_PORT || 6379),
      db: 1
    };

    try {
    this.client = new Redis(optionsConfig);
    this.logger.log(`Redis instance ${this.client} initialized`);
    } catch (error) {
      this.logger.error('Failed to initialize redis', error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(
    key: string,
    value: string,
    mode?: 'EX',
    duration?: number,
  ): Promise<void> {
    if (mode && duration) {
      await this.client.set(key, value, mode, duration);
    } else {
      await this.client.set(key, value);
    }
  }

  pipeline(): ChainableCommander {
    return this.client.pipeline();
  }


  async zadd(key: string, score: number, number: number) {
    try {
      const result = await this.client.zadd(key, score, number);
    } catch(error) {
      console.error(`Could not add ${error}`);
      throw error.stack;
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
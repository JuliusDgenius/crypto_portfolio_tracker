import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

interface RateLimitRule {
  points: number;   // max allowed calls
  duration: number; // seconds
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly defaultRule: RateLimitRule = { points: 50, duration: 60 };

  constructor(private readonly redis: RedisService) {}

  async consume(
    key: string,
    customRule?: RateLimitRule,
  ): Promise<{ ok: boolean; remaining: number; msBeforeNext: number }> {
    const rule = customRule || this.defaultRule;
    const redisKey = `app:ratelimit:${key}`;

    const exists = await this.redis.exists(redisKey);
    const count = await this.redis.incr(redisKey);
    if (!exists) await this.redis.expire(redisKey, rule.duration);

    if (count > rule.points) {
      const ttl = await this.redis.ttl(redisKey);
      const msBeforeNext = ttl > 0 ? ttl * 1000 : rule.duration * 1000;
      this.logger.warn(`Rate limit exceeded for ${key}`);
      return { ok: false, remaining: 0, msBeforeNext };
    }

    const ttl = await this.redis.ttl(redisKey);
    const remaining = Math.max(rule.points - count, 0);
    return { ok: true, remaining, msBeforeNext: ttl > 0 ? ttl * 1000 : 0 };
  }

  async reset(key: string) {
    await this.redis.del(`app:ratelimit:${key}`);
  }
}

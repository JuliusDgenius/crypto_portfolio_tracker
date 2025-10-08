import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NO_RATE_LIMIT, RATE_LIMIT_KEY } from '../../../../common/src';
import { RateLimitService } from '../rate-limiter.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rateLimiter: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const controller = context.getClass();

    // Try to get decorator metadata from handler or controller
    const meta =
      this.reflector.getAllAndOverride(RATE_LIMIT_KEY, [handler, controller]);

    // Define default rule if no decorator is found
    const defaultRule = {
      key: 'global',
      rule: { points: 100, duration: 60 }, // 100 requests per minute by default
    };

    // Skip rate limiting
    const skip = this.reflector.getAllAndOverride(
      NO_RATE_LIMIT, [handler, controller]
    );
    if (skip) return true;


    // Merge (so decorator overrides defaults)
    const { key, rule } = meta || defaultRule;

    const req = context.switchToHttp().getRequest();
    const userKey = req.user?.id || req.ip;
    const compositeKey = `${key}:${userKey}`;

    const result = await this.rateLimiter.consume(compositeKey, rule);

    if (!result.ok) {
      throw new Error(
        `Rate limit exceeded. Try again in ${(result.msBeforeNext / 1000).toFixed(1)}s`,
      );
    }

    return true;
  }
}

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY } from '../../../../common/src';
import { RateLimitService } from '../../../../database/src';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rateLimiter: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const meta = this.reflector.getAllAndOverride(RATE_LIMIT_KEY, [handler]);
    if (!meta) return true;

    const { key, rule } = meta;
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

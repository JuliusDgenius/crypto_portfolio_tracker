import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DatabaseHealthIndicator } from './health.service';
import { RateLimitGuard, RateLimitService, RedisService } from './redis';

/**
 * Module providing database connectivity and health monitoring
 * @module DatabaseModule
 */
@Module({
  providers: [
    PrismaService, 
    DatabaseHealthIndicator, 
    RedisService, RateLimitService, 
    RateLimitGuard
  ],
  exports: [
    PrismaService, 
    DatabaseHealthIndicator,
    RedisService, RateLimitService, RateLimitGuard
  ],
})
export class DatabaseModule {}

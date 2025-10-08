import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './prisma.service';
import { DatabaseHealthIndicator } from './health.service';
import { 
  RateLimitGuard, RateLimitService,
   REDIS_OPTIONS, RedisService 
  } from './redis';

/**
 * Module providing database connectivity and health monitoring
 * @module DatabaseModule
 */
@Module({
  providers: [
    PrismaService, 
    DatabaseHealthIndicator, 
    RedisService, RateLimitService, 
    RateLimitGuard,
    {
      provide: REDIS_OPTIONS,
      useValue: {
        host: process.env.REDIS_HOST || 'localhost',
        port: +(process.env.REDIS_PORT || 6379),
        db: 1,
      },
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
  exports: [
    PrismaService, 
    DatabaseHealthIndicator,
    RedisService, RateLimitService, RateLimitGuard
  ],
})
export class DatabaseModule {}

import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DatabaseHealthIndicator } from './health.service';

/**
 * Module providing database connectivity and health monitoring
 * @module DatabaseModule
 */
@Module({
  providers: [PrismaService, DatabaseHealthIndicator],
  exports: [PrismaService, DatabaseHealthIndicator],
})
export class DatabaseModule {}

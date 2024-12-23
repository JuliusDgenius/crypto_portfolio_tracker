import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError
} from '@nestjs/terminus';
import { PrismaService } from './prisma.service';

/**
 * Health check indicator for database connectivity
 * @class DatabaseHealthIndicator
 * @extends {HealthIndicator}
 */
@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Checks database health by executing a simple query
   * @param {string} key - Key for the health check result
   * @returns {Promise<HealthIndicatorResult>} Health check result
   * @throws {HealthCheckError} When database is not healthy
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$connect();
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'Database health check failed',
        this.getStatus(key, false)
      );
    }
  }
} 
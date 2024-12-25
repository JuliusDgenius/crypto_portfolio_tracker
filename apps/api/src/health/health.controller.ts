import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService
} from '@nestjs/terminus';
import {
  DatabaseHealthIndicator
} from '../../../../libs/database/src';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: DatabaseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.isHealthy('database'),
    ]);
  }
} 
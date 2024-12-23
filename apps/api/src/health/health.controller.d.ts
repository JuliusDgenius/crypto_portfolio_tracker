import { HealthCheckService } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from '@lib/database';
export declare class HealthController {
    private health;
    private db;
    constructor(health: HealthCheckService, db: DatabaseHealthIndicator);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult>;
}

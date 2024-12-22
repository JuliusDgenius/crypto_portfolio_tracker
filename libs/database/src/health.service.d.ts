import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from './prisma.service';
export declare class DatabaseHealthIndicator extends HealthIndicator {
    private readonly prisma;
    constructor(prisma: PrismaService);
    isHealthy(key: string): Promise<HealthIndicatorResult>;
}

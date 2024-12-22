import { INestApplication, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RetryOptions } from './interfaces/retry-options.interface';
export declare class PrismaService extends PrismaClient implements OnModuleInit {
    private readonly logger;
    private readonly maxRetries;
    private readonly retryDelay;
    constructor();
    onModuleInit(): Promise<void>;
    enableShutdownHooks(app: INestApplication): Promise<void>;
    executeOperation<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<T>;
    private executeWithRetry;
    private shouldRetry;
    private handleDatabaseError;
    private delay;
}

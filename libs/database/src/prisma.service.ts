import { INestApplication, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { BaseException } from '@libs/common';
import { RetryOptions } from './interfaces/retry-options.interface';

/**
 * Service wrapper for Prisma ORM client
 * @class PrismaService
 * @extends {PrismaClient}
 * @implements {OnModuleInit}
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor() {
    super({
      log: [
        { emit: 'stdout', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
      ],
      // Prisma's connection handling
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  /**
   * Initializes Prisma Client when module starts
   */
  async onModuleInit() {
    try {
      await this.executeWithRetry(() => this.$connect());
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error.stack);
      throw new BaseException(
        'Database connection failed',
        'DATABASE_CONNECTION_ERROR',
        500
      );
    }
  }

  /**
   * Ensures graceful shutdown of Prisma Client
   * @param {INestApplication} app - NestJS application instance
   */
  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await this.$disconnect();
      await app.close();
    });
  }

  /**
   * Executes a database operation with error handling and retry logic
   * @param operation - Database operation to execute
   * @param options - Retry options
   * @returns Promise with operation result
   */
  async executeOperation<T>(
    operation: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    try {
      return await this.executeWithRetry(operation, options);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  /**
   * Executes an operation with retry logic
   * @param operation - Operation to execute
   * @param options - Retry options
   * @returns Promise with operation result
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = { maxRetries: this.maxRetries, delay: this.retryDelay }
  ): Promise<T> {
    let lastError: Error = new Error('Operation failed');
    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (this.shouldRetry(error) && attempt < options.maxRetries) {
          this.logger.warn(
            `Attempt ${attempt} failed, retrying in ${options.delay}ms...`
          );
          await this.delay(options.delay);
          continue;
        }
        break;
      }
    }
    throw lastError;
  }

  /**
   * Determines if an error is retryable
   * @param error - Error to check
   * @returns boolean indicating if operation should be retried
   */
  private shouldRetry(error: { code?: string }): boolean {
    const retryableCodes = [
      'P1001', // Connection error
      'P1002', // Connection timed out
      'P1008', // Operations timed out
      'P1017', // Server closed the connection
      'P2024', // Connection pool timeout
    ];

    return error?.code ? retryableCodes.includes(error.code) : false;
  }

  /**
   * Handles database errors with specific error types
   * @param error - Error to handle
   */
  private handleDatabaseError(error: any): never {
    const errorMap: Record<string, [string, string, number]> = {
      P1001: ['Database connection failed', 'DATABASE_CONNECTION_ERROR', 500],
      P2002: ['Unique constraint violation', 'UNIQUE_CONSTRAINT_ERROR', 400],
      P2003: ['Foreign key constraint violation', 'FOREIGN_KEY_ERROR', 400],
      P2025: ['Record not found', 'NOT_FOUND_ERROR', 404],
      P2028: ['Transaction error', 'TRANSACTION_ERROR', 500],
    };

    const [message, code, status] = errorMap[error?.code] || [
      'Database operation failed',
      'DATABASE_OPERATION_ERROR',
      500,
    ];

    this.logger.error(`${message}: ${error.message}`, error.stack);
    throw new BaseException(message, code, status);
  }

  /**
   * Delays execution for specified milliseconds
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
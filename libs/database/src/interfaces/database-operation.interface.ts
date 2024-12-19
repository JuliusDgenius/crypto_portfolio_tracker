import { RetryOptions } from './retry-options.interface';

/**
 * Options for database operations
 */
export interface DatabaseOperationOptions extends RetryOptions {
  /** Operation timeout in milliseconds */
  timeout?: number;
  /** Whether to run in a transaction */
  transaction?: boolean;
}

/**
 * Options for database transactions
 */
export interface TransactionOptions {
  /** SQL transaction isolation level */
  isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
  /** Transaction timeout in milliseconds */
  timeout?: number;
}

/**
 * Options for batch operations
 */
export interface BatchOperationOptions {
  /** Skip duplicate entries instead of failing */
  skipDuplicates?: boolean;
  /** Operation timeout in milliseconds */
  timeout?: number;
} 
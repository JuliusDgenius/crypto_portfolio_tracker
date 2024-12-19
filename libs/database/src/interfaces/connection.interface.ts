/**
 * Database connection configuration options
 */
export interface ConnectionOptions {
  /** Database connection URL */
  url: string;
  /** Enable SSL connection */
  ssl?: boolean;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Maximum number of connections in the pool */
  maxConnections?: number;
}

/**
 * Database health check response
 */
export interface DatabaseHealth {
  /** Overall health status */
  isHealthy: boolean;
  /** Response time in milliseconds */
  responseTime: number;
  /** Connection pool statistics */
  connections: {
    /** Number of active connections */
    active: number;
    /** Number of idle connections */
    idle: number;
    /** Maximum allowed connections */
    max: number;
  };
  /** Last error message if any */
  lastError?: string;
} 
/**
 * Represents a database error with optional Prisma error code
 */
export interface DatabaseError {
  /** Prisma error code (e.g., P1001, P2002) */
  code?: string;
  /** Error message */
  message: string;
  /** Error stack trace */
  stack?: string;
}

/**
 * Maps database error codes to their corresponding messages and status codes
 */
export interface ErrorMapEntry {
  /** Human-readable error message */
  message: string;
  /** Application-specific error code */
  code: string;
  /** HTTP status code */
  status: number;
} 
/**
 * Base response interface for API responses
 * @typeParam T - Type of data being returned
 */
export interface IBaseResponse<T> {
  /** Response payload */
  data: T;
  /** Response timestamp */
  timestamp: string;
  /** HTTP status code */
  statusCode?: number;
  /** Optional response message */
  message?: string;
}

/**
 * Interface for paginated API responses
 * @typeParam T - Type of items in the paginated response
 */
export interface IPaginatedResponse<T> extends IBaseResponse<T[]> {
  /** Total number of items */
  total: number;
  /** Current page number */
  page: number;
  /** Number of items per page */
  limit: number;
} 
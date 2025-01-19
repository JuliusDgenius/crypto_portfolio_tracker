export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    status: number;
  }
  
  export interface IApiError {
    message: string;
    status: number;
    errors?: Record<string, string[]>;
  }
  
  export interface RequestConfig extends Omit<RequestInit, 'body'> {
    params?: Record<string, string | number | boolean>;
    data?: any;
    withCredentials?: boolean;
  }

  export interface InterceptorConfig extends RequestConfig {
    endpoint: string;
    baseURL: string;
  }
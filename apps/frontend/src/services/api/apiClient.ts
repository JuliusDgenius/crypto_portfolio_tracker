import { API_CONFIG } from './config';
import { ApiError } from './error';
import { requestInterceptor, responseInterceptor } from './interceptor';
import { ApiResponse, RequestConfig } from './types';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    // Apply request interceptor
    const { url, init } = requestInterceptor({
        ...config,
        endpoint,
    baseURL: this.baseURL,
    headers: {
        ...API_CONFIG.HEADERS,
        ...config.headers,
    },
    credentials: API_CONFIG.CREDENTIALS,
    });

    // add request body if provided
    if (config.data) {
        init.body = JSON.stringify(config.data);
    }

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    init.signal = controller.signal;

    try {
      const response = await fetch(url, init);
      clearTimeout(timeoutId);

      // Apply response interceptor
      const interceptedResponse = await responseInterceptor(response);
      const data = await interceptedResponse.json();

      return {
        data,
        status: response.status,
        message: data.message,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout');
      }
      throw new ApiError(500, 'An unexpected error occurred');
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', data });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', data });
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', data });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_CONFIG.BASE_URL);
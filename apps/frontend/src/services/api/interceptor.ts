import { ApiError } from './error';
import { InterceptorConfig } from './types';

export const requestInterceptor = (config: InterceptorConfig): { url: string; init: RequestInit } => {
  // Get the token from localStorage
  const token = localStorage.getItem('accessToken');
  const headers = new Headers(config.headers);
  // Add authorization header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Add query parameters if they exist
  let url = `${config.baseURL}${config.endpoint}`;
  if (config.params) {
    const queryParams = new URLSearchParams();
    Object.entries(config.params).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });
    url += `?${queryParams.toString()}`;
  }

//   prepare the final request configuration
  const init: RequestInit = {
    ...config,
    headers
  }

  // Remove custom properties that aren't part of RequestInit
  delete (init as any).params;
  delete (init as any).data;
  delete (init as any).withCredentials;
  delete (init as any).endpoint;
  delete (init as any).baseURL;

  return {url, init};
};

export const responseInterceptor = async (response: Response) => {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw ApiError.fromResponse(response, data);
  }

  return response;
};

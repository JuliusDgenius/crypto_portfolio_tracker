export class ApiError extends Error {
    constructor(
      public status: number,
      public message: string,
      public errors?: Record<string, string[]>
    ) {
      super(message);
      this.name = 'ApiError';
    }
  
    static fromResponse(response: Response, data?: any): ApiError {
      return new ApiError(
        response.status,
        data?.message || response.statusText,
        data?.errors
      );
    }
  }
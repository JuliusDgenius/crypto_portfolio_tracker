import { LoggingInterceptor } from './logging.interceptor';
import { createMock } from '@golevelup/ts-jest';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockCallHandler: CallHandler;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;
  let mockGetRequest: jest.Mock;
  let mockHttpArgumentsHost: jest.Mock;
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    mockRequest = {
      method: 'GET',
      url: '/test',
    };
    mockGetRequest = jest.fn().mockReturnValue(mockRequest);
    mockHttpArgumentsHost = jest.fn().mockReturnValue({
      getRequest: mockGetRequest,
    });
    mockExecutionContext = createMock<ExecutionContext>({
      switchToHttp: mockHttpArgumentsHost,
    });
    mockCallHandler = createMock<CallHandler>({
      handle: () => of({ test: 'data' }),
    });

    loggerSpy = jest.spyOn(interceptor['logger'], 'log');
  });

  it('should log request with timing', (done) => {
    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringMatching(/GET \/test \d+ms/)
        );
        done();
      },
    });
  });

  it('should pass through the response', (done) => {
    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (value) => {
        expect(value).toEqual({ test: 'data' });
        done();
      },
    });
  });
}); 
import { TransformInterceptor } from './transform.interceptor';
import { createMock } from '@golevelup/ts-jest';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;
  let mockCallHandler: CallHandler;
  let mockExecutionContext: ExecutionContext;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
    mockCallHandler = createMock<CallHandler>({
      handle: () => of({ test: 'data' }),
    });
    mockExecutionContext = createMock<ExecutionContext>();
  });

  it('should transform response to expected format', (done) => {
    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (value) => {
        expect(value).toEqual({
          data: { test: 'data' },
          timestamp: expect.any(String),
        });
        done();
      },
    });
  });

  it('should handle null data', (done) => {
    mockCallHandler = createMock<CallHandler>({
      handle: () => of(null),
    });

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (value) => {
        expect(value).toEqual({
          data: null,
          timestamp: expect.any(String),
        });
        done();
      },
    });
  });
}); 
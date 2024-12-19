import { ApiKeyGuard } from './api-key.guard';
import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let mockExecutionContext: ExecutionContext;
  let mockGetRequest: jest.Mock;
  let mockHttpArgumentsHost: jest.Mock;

  beforeEach(() => {
    process.env.API_KEY = 'test-api-key';
    guard = new ApiKeyGuard();

    mockGetRequest = jest.fn().mockReturnValue({
      headers: {},
    });
    mockHttpArgumentsHost = jest.fn().mockReturnValue({
      getRequest: mockGetRequest,
    });
    mockExecutionContext = createMock<ExecutionContext>({
      switchToHttp: mockHttpArgumentsHost,
    });
  });

  it('should allow request with valid API key', () => {
    mockGetRequest.mockReturnValue({
      headers: { 'x-api-key': 'test-api-key' },
    });

    expect(guard.canActivate(mockExecutionContext)).toBe(true);
  });

  it('should throw UnauthorizedException when API key is missing', () => {
    expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when API key is invalid', () => {
    mockGetRequest.mockReturnValue({
      headers: { 'x-api-key': 'wrong-api-key' },
    });

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException);
  });

  afterEach(() => {
    delete process.env.API_KEY;
  });
}); 
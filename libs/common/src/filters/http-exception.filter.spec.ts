import { HttpExceptionFilter } from './http-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { ArgumentsHost } from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockGetRequest: jest.Mock;
  let mockGetResponse: jest.Mock;
  let mockHttpArgumentsHost: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockGetRequest = jest.fn().mockReturnValue({ url: '/test' });
    mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
    mockHttpArgumentsHost = jest.fn().mockReturnValue({
      getResponse: mockGetResponse,
      getRequest: mockGetRequest,
    });

    const mockArgumentsHost = createMock<ArgumentsHost>({
      switchToHttp: mockHttpArgumentsHost,
    });

    filter = new HttpExceptionFilter();
  });

  it('should transform HttpException to expected format', () => {
    const exception = new HttpException('Test message', HttpStatus.BAD_REQUEST);
    const host = createMock<ArgumentsHost>({
      switchToHttp: mockHttpArgumentsHost,
    });

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: expect.any(String),
      path: '/test',
      message: 'Test message',
    });
  });

  it('should handle HttpException with object response', () => {
    const exception = new HttpException(
      { message: 'Test message', additionalInfo: 'info' },
      HttpStatus.BAD_REQUEST,
    );
    const host = createMock<ArgumentsHost>({
      switchToHttp: mockHttpArgumentsHost,
    });

    filter.catch(exception, host);

    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: expect.any(String),
      path: '/test',
      message: 'Test message',
    });
  });
}); 
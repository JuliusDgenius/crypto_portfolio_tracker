import { 
  ExceptionFilter, 
  Catch, 
  ArgumentsHost, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { BaseException } from '../exceptions';

/**
 * Global exception filter to handle all exceptions
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : exception instanceof BaseException
        ? exception.code
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = 
      exception instanceof HttpException || exception instanceof BaseException
        ? exception.message
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    response.status(status).json(errorResponse);
  }
} 
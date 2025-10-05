import { HttpException, HttpStatus } from '@nestjs/common';

export interface BaseExceptionResponse {
  message: string;
  code?: string;
  details?: any;
}

export class BaseException extends HttpException {
  public readonly code?: string;
  public readonly details?: any;

  // overload signatures (for TS typing)
  constructor(message: string, code?: string, statusCode?: number);
  constructor(message: string, status?: number, code?: string, details?: any);
  // implementation
  constructor(
    message: string,
    a?: string | number,
    b?: number | string,
    details?: any,
  ) {
    // default values
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string | undefined;
    let parsedDetails: any = details;

    // Detect legacy signature: (message, code(string), statusCode(number))
    if (typeof a === 'string') {
      code = a;
      status = typeof b === 'number' ? b : HttpStatus.INTERNAL_SERVER_ERROR;
    } else if (typeof a === 'number') {
      // New/idiomatic signature: (message, status(number), code?: string, details?: any)
      status = a;
      code = typeof b === 'string' ? (b as string) : undefined;
    }

    const response: BaseExceptionResponse = {
      message,
      ...(code ? { code } : {}),
      ...(parsedDetails ? { details: parsedDetails } : {}),
    };

    super(response, status);

    this.code = code;
    this.details = parsedDetails;
    // keep proper name and stack trace
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // A typed getter to make it easy for filters to obtain a unified response
  getFormattedResponse(): BaseExceptionResponse & { statusCode: number } {
    const r = super.getResponse() as BaseExceptionResponse;
    return { 
      ...(typeof r === 'object' ? r : { message: String(r) }),
      statusCode: this.getStatus() } as any;
  }
}
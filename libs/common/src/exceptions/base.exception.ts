/**
 * Base exception class for standardized error handling
 * @class BaseException
 * @extends {Error}
 */
export class BaseException extends Error {
    constructor(
      /** Error message */
      public readonly message: string,
      /** Error code for identifying the error type */
      public readonly code: string,
      /** HTTP status code, defaults to 500 */
      public readonly statusCode: number = 500
    ) {
      super(message);
      this.name = this.constructor.name;
    }
  }
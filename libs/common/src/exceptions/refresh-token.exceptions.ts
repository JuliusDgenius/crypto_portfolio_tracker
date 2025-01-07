// src/auth/exceptions/refresh-token.exceptions.ts

import { UnauthorizedException } from '@nestjs/common';

export class TokenExpiredException extends UnauthorizedException {
  constructor() {
    super('Refresh token has expired');
    this.name = 'TokenExpiredException';
  }
}

export class TokenReusedException extends UnauthorizedException {
  constructor() {
    super('Token reuse detected. All tokens have been invalidated for security');
    this.name = 'TokenReusedException';
  }
}

export class InvalidTokenException extends UnauthorizedException {
  constructor() {
    super('Invalid refresh token');
    this.name = 'InvalidTokenException';
  }
}

export class UserNotFoundException extends UnauthorizedException {
  constructor() {
    super('User not found');
    this.name = 'UserNotFoundException';
  }
}
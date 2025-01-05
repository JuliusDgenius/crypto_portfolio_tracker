import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  private readonly logger = new Logger(JwtRefreshGuard.name);
  constructor() {
    super();
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      this.logger.error(`Authentication failed: ${err?.message || 'Unknown error'}`);
      throw err || new UnauthorizedException('Invalid refresh token');
    }
    return user;
  }
} 
import {
  Injectable,
  Logger,
  UnauthorizedException
} from '@nestjs/common';
import {
  PassportStrategy
} from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy
} from 'passport-jwt';
import { ConfigService } from '../../../config/src';
import { Request } from 'express';
import { UserRepository } from '../../../core/src';
import { JwtPayload } from '../interfaces';
import { JwtSecretType } from './jwt-secrets';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  private readonly logger = new Logger(JwtRefreshStrategy.name);

  constructor(
    configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>(JwtSecretType.REFRESH),
      passReqToCallback: true,

      ignoreExpiration: false,
      jwtid: undefined,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    try {
      this.logger.debug('Validating refresh token for user:', payload.sub);

      const refreshToken = req.get('authorization')?.replace('Bearer ', '').trim();
      
      if (!refreshToken) {
        this.logger.debug('No refresh token found in request');
        throw new UnauthorizedException('No refresh token provided');
      }

      this.logger.debug(`Refresh token found: ${refreshToken.substring(0, 10)}...`);

      // Verify token structure before database lookup
      try {
        const tokenParts = refreshToken.split('.');
        if (tokenParts.length !== 3) {
          this.logger.error('Invalid token structure');
          throw new UnauthorizedException('Invalid token format');
        }
      } catch (e) {
        this.logger.error('Error parsing token:', e);
        throw new UnauthorizedException('Invalid token format');
      }

      const user = await this.userRepository.findById(payload.sub);

      if (!user) {
        this.logger.debug('User not found:', payload.sub);
        throw new UnauthorizedException('User not found');
      }

      this.logger.debug(`User found: ${user.email}`);
      
      // Single source of truth for token validation
      const isValidRefreshToken = await this.userRepository.verifyRefreshToken(
        user.id, 
        refreshToken
      );
      
      this.logger.debug(`Token validation result: ${isValidRefreshToken}`);

      if (!isValidRefreshToken) {
        this.logger.debug('Invalid refresh token for user:', payload.sub);
        throw new UnauthorizedException('Invalid refresh token');
      }

      this.logger.debug('Refresh token validated successfully');
      
      return {
        ...user,
        refreshToken,
      };

      } catch (error) {
        this.logger.error('Validation error:', error);
      throw error;
    }
    throw new UnauthorizedException('Token validation failed');
  }
}

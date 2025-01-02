import {
  Injectable,
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
  constructor(
    configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>(JwtSecretType.REFRESH),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.get('authorization').replace('Bearer', '').trim();
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return { ...user, refreshToken };
  }
}

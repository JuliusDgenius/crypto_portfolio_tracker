import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../../core/src';
import { JwtPayload } from '../interfaces';
import { JwtSecretType } from './jwt-secrets';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>(JwtSecretType.ACCESS),
    });

    // Log the secret being used (be careful with this in production!)
    console.log(
      'JWT Strategy initialized with secret:',
      configService.get<string>(
        'JWT_VERIFICATION_SECRET')?.substring(0, 3) + '...');
  }

  async validate(payload: JwtPayload) {
    console.log('JWT Strategy - Validating payload:', payload);

    const user = await this.userRepository.findById(payload.sub);
    console.log('JWT Strategy - Found user:', user ? 'Yes' : 'No');

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name
    };
  }
}

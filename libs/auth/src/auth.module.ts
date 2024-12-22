import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@lib/config';
import { DatabaseModule } from '@lib/database';
import { AuthService } from '@lib/auth';
import { AuthController } from '@lib/auth';
import { JwtStrategy } from '@lib/auth';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { EmailService } from './services/email.service';
import { TwoFactorService } from './services/two-factor.service';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: '15m' // Access token expires in 15 minutes
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailService,
    TwoFactorService,
    JwtStrategy,
    RefreshTokenStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
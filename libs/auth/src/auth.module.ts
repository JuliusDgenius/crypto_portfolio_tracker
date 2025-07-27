import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../../core/src';
import { AuthService } from './services/auth.service';
import { TotpService } from './services/totp.service';
import { EmailService } from '../../common/src/email/email.service';
import { AuthController } from './controllers';
import { JwtStrategy, JwtRefreshStrategy } from './strategies';
import { PrismaService } from '../../database/src';
import { EmailModule } from '../../common/src/email/email.module';

@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    ConfigModule,
    EmailModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TotpService,
    JwtStrategy,
    JwtRefreshStrategy,
    PrismaService,
    EmailService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
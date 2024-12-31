import { DatabaseModule } from '../../../libs/database/src';
import { AuthModule } from '../../../libs/auth/src';
import { CryptoModule } from '../../../libs/crypto/src';
import { PortfolioModule } from '../../../libs/portfolio/src';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    DatabaseModule,
    AuthModule,
    CryptoModule,
    PortfolioModule,
  ],
})
export class AppModule {}

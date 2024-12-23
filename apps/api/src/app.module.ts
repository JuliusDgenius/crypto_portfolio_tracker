import { DatabaseModule } from '../../../libs/database/src';
import { AuthModule } from '../../../libs/auth/src';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    DatabaseModule,
    AuthModule,
  ],
})
export class AppModule {}

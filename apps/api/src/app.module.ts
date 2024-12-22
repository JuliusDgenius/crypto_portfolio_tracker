import { DatabaseModule } from '@lib/database';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    DatabaseModule,
    AuthModule
  ],
})
export class AppModule {}

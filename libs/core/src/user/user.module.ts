// libs/core/src/user/user.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@libs/database';
import { UserRepository } from './repositories/user.repository';
import { PasswordService } from './services/password.service';

@Module({
  imports: [DatabaseModule],
  providers: [UserRepository, PasswordService],
  exports: [UserRepository, PasswordService],
})
export class UserModule {}
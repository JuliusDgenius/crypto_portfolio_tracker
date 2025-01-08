import { Module } from '@nestjs/common';
import { CoreService } from './core.service';
import { ExchangeAccountService } from './exchange-account/exchange-account.service';
import { ExchangeAccountController } from './exchange-account/exchange-account.controller';

/**
 * Core module providing fundamental functionality
 * @module CoreModule
 */
@Module({
  controllers: [ExchangeAccountController],
  providers: [CoreService, ExchangeAccountService],
  exports: [CoreService, ExchangeAccountService],
})
export class CoreModule {}

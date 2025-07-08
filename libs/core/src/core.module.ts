import { Module } from '@nestjs/common';
import { CoreService } from './core.service';
import { ExchangeAccountService } from './exchange-account/exchange-account.service';
import { ExchangeAccountController } from './exchange-account/exchange-account.controller';
import { WalletAddressController } from './wallet-address/wallet-address.controller';
import { WalletAddressService } from './wallet-address/wallet-address.service';
import { SyncService } from './sync/sync.service';
import { BinanceIntegrationService } from './sync/binance-integration.service';
import { WalletIntegrationService } from './sync/wallet-integration.service';
import { DatabaseModule } from '../../../libs/database/src/database.module';
import { CryptoModule } from '../../../libs/crypto/src/crypto.module';

/**
 * Core module providing fundamental functionality
 * @module CoreModule
 */
@Module({
  imports: [DatabaseModule, CryptoModule],
  controllers: [ExchangeAccountController, WalletAddressController],
  providers: [
    CoreService,
    ExchangeAccountService,
    WalletAddressService,
    SyncService,
    BinanceIntegrationService,
    WalletIntegrationService,
  ],
  exports: [
    CoreService,
    ExchangeAccountService,
    WalletAddressService,
    SyncService,
    BinanceIntegrationService,
    WalletIntegrationService,
  ],
})
export class CoreModule {}

import { Injectable, Logger } from '@nestjs/common';
import { BinanceIntegrationService } from './binance-integration.service';
import { WalletIntegrationService } from './wallet-integration.service';
import { PrismaService } from '../../../database/src';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly binanceIntegration: BinanceIntegrationService,
    private readonly walletIntegration: WalletIntegrationService,
  ) {}

  async syncAll() {
    // Fetch all users and sync their accounts/addresses
    const users = await this.prisma.user.findMany();
    for (const user of users) {
      await this.syncUser(user.id);
    }
  }

  async syncUser(userId: string) {
    await this.syncExchangeAccounts(userId);
    await this.syncWalletAddresses(userId);
  }

  async syncExchangeAccounts(userId: string) {
    const accounts = await this.prisma.exchangeAccount.findMany({ where: { userId, isActive: true } });
    for (const account of accounts) {
      // Fetch balances and transactions from Binance
      const balances = await this.binanceIntegration.fetchBalances(account.apiKey, account.apiSecret);
      const transactions = await this.binanceIntegration.fetchTransactions(account.apiKey, account.apiSecret);
      // TODO: Update portfolio/assets/transactions in DB
    }
  }

  async syncWalletAddresses(userId: string) {
    const wallets = await this.prisma.walletAddress.findMany({ where: { userId, isActive: true } });
    for (const wallet of wallets) {
      if (wallet.blockchain === 'bitcoin') {
        const data = await this.walletIntegration.fetchBtcBalance(wallet.address);
        // TODO: Update portfolio/assets/transactions in DB
      } else if (wallet.blockchain === 'ethereum') {
        const data = await this.walletIntegration.fetchEthBalance(wallet.address);
        // TODO: Update portfolio/assets/transactions in DB
      } else {
        const data = await this.walletIntegration.fetchEvmBalance(wallet.address, wallet.blockchain);
        // TODO: Update portfolio/assets/transactions in DB
      }
    }
  }
} 
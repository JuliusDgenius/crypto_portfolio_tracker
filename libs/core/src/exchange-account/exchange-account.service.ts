import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../database/src';
import { CreateExchangeAccountDTO } from './dto/create-exchange-account.dto';
import { ExchangeAccount } from '@prisma/client';
import { PriceService, WebSocketService, MarketService } from '../../../crypto/src'; // Assume this exists for API interactions

@Injectable()
export class ExchangeAccountService {
  constructor(
    private prisma: PrismaService,
    private priceService: PriceService,
    private readonly marketService: MarketService,
    private readonly websocketService: WebSocketService,
  ) {}

  async create(userId: string, dto: CreateExchangeAccountDTO): Promise<ExchangeAccount> {
    // Check for existing account with same name for this user
    const existing = await this.prisma.exchangeAccount.findFirst({
      where: {
        userId,
        name: dto.name,
      },
    });

    if (existing) {
      throw new ConflictException('Account with this name already exists');
    }

    // Verify API credentials before saving
    await this.verifyExchangeCredentials(dto);

    return this.prisma.exchangeAccount.create({
      data: {
        userId,
        exchange: dto.exchange,
        name: dto.name,
        apiKey: dto.apiKey,
        apiSecret: dto.apiSecret,
        lastSync: new Date(),
      },
    });
  }

  async findAll(userId: string): Promise<ExchangeAccount[]> {
    return this.prisma.exchangeAccount.findMany({
      where: { userId },
    });
  }

  async findOne(userId: string, accountId: string): Promise<ExchangeAccount> {
    const account = await this.prisma.exchangeAccount.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new NotFoundException('Exchange account not found');
    }

    return account;
  }

  async remove(userId: string, accountId: string): Promise<void> {
    await this.findOne(userId, accountId); // Verify existence and ownership
    await this.prisma.exchangeAccount.delete({
      where: { id: accountId },
    });
  }

  async syncExchangeData(accountId: string): Promise<void> {
    const account = await this.prisma.exchangeAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Exchange account not found');
    }

    // Fetch latest data from exchange
    await this.marketService.syncExchangeData(account);

    // Update last sync timestamp
    await this.prisma.exchangeAccount.update({
      where: { id: accountId },
      data: { lastSync: new Date() },
    });
  }

  private async verifyExchangeCredentials(dto: CreateExchangeAccountDTO): Promise<boolean> {
    try {
      // Attempt to make a test API call to verify credentials
      await this.cryptoService.testExchangeConnection(dto.exchange, dto.apiKey, dto.apiSecret);
      return true;
    } catch (error) {
      throw new ConflictException('Invalid API credentials');
    }
  }
}

// libs/portfolio/src/services/transaction.service.ts
import {
  Injectable,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { PrismaService } from '../../../database/src';
import { Transaction, TransactionType, Prisma } from '@prisma/client';
import { CreateTransactionDto } from '../dto';
import { PortfolioService } from './portfolio.service';

@Injectable()
export class TransactionService {
  constructor(
    private prisma: PrismaService,
    private portfolioService: PortfolioService,
  ) {}

  async createTransaction(
    portfolioId: string,
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<Transaction> {
    // First verify portfolio ownership
    const portfolio = await this.prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        userId,
      },
    });

    if (!portfolio) {
      throw new ForbiddenException('Portfolio not found or access denied');
    }

    return this.prisma.$transaction(async (prisma) => {
      const transaction = await prisma.transaction.create({
        data: {
          portfolioId,
          type: dto.type,
          cryptocurrency: dto.cryptocurrency,
          amount: dto.amount,
          price: dto.price,
          fee: dto.fee,
          exchange: dto.exchange,
          wallet: dto.wallet,
          notes: dto.notes,
          date: dto.date,
        } as unknown as Prisma.TransactionCreateInput,
      });

      // Update or create asset
      const existingAsset = await prisma.asset.findFirst({
        where: {
          portfolioId,
          symbol: dto.cryptocurrency,
        },
      });

      const assetData: Prisma.AssetUpdateInput | Prisma.AssetCreateInput = {
        portfolio: {
          connect: { id: portfolioId },
        },
        symbol: dto.cryptocurrency,
        name: dto.cryptocurrency,
        amount: existingAsset 
          ? this.calculateNewAmount(existingAsset.amount, dto.amount, dto.type)
          : dto.amount,
        averageBuyPrice: this.calculateAverageBuyPrice(existingAsset, dto),
        currentPrice: dto.price,
        value: dto.amount * dto.price,
        profitLoss: 0, // This will be updated by analytics service
        allocation: 0, // This will be updated by analytics service
        lastUpdated: new Date(),
      };

      if (existingAsset) {
        await prisma.asset.update({
          where: { id: existingAsset.id },
          data: assetData,
        });
      } else if (dto.type === TransactionType.BUY) {
        await prisma.asset.create({
          data: assetData as Prisma.AssetCreateInput,
        });
      }

      return transaction;
    });
  }

  async getTransactions(
    portfolioId: string,
    userId: string,
    options: {
      page: number;
      limit: number;
      type?: TransactionType;
      cryptocurrency?: string;
    },
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const where: Prisma.TransactionWhereInput = {
      portfolioId,
      portfolio: {
        userId,
      },
    };

    if (options.type) {
      where.type = options.type;
    }

    if (options.cryptocurrency) {
      where.cryptocurrency = options.cryptocurrency;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip: (options.page - 1) * options.limit,
        take: options.limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { transactions, total };
  }

  private calculateNewAmount(
    currentAmount: number,
    transactionAmount: number,
    type: TransactionType,
  ): number {
    switch (type) {
      case TransactionType.BUY:
      case TransactionType.TRANSFER_IN:
        return currentAmount + transactionAmount;
      case TransactionType.SELL:
      case TransactionType.TRANSFER_OUT:
        return currentAmount - transactionAmount;
      default:
        throw new BadRequestException('Invalid transaction type');
    }
  }

  private calculateAverageBuyPrice(
    asset: any,
    transaction: CreateTransactionDto,
  ): number {
    if (transaction.type !== TransactionType.BUY) {
      return asset.averageBuyPrice;
    }

    const totalValue =
      asset.amount * asset.averageBuyPrice +
      transaction.amount * transaction.price;
    const totalAmount = asset.amount + transaction.amount;

    return totalValue / totalAmount;
  }
}

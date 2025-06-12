import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from '../../../database/src';
import { Transaction, Prisma, TransactionType } from '@prisma/client';
import { CreateTransactionDto, PortfolioTransactionType } from '../dto';
import { PortfolioService } from './portfolio.service';

@Injectable()
export class TransactionService {

  constructor(
    private prisma: PrismaService,
    private portfolioService: PortfolioService,
  ) {}

  // Transaction Management
  async createTransaction(
    userId: string,
    portfolioId: string,
    dto: CreateTransactionDto
  ): Promise<Transaction> {
    // validate portfolio access
    await this.portfolioService.validatePortfolioAccess(userId, portfolioId);
  
    // Use transaction to ensure data consistency
    return this.prisma.$transaction(async (tx) => {
      // Get or create the asset
      const asset = await this.portfolioService.getOrCreateAsset(
        portfolioId,
        dto.cryptocurrency,
        dto.cryptocurrency // Using symbol as name initially, can be updated later
      );

    if (!asset) {
      throw new NotFoundException('Asset not found in portfolio');
    }

    // Validate sufficient balance for sell transactions
    if (
      (dto.type === TransactionType.SELL || dto.type === TransactionType.TRANSFER_OUT) && 
      asset.quantity < dto.amount
    ) {
      throw new BadRequestException('Insufficient asset balance for transaction');
    }


    // Calculate new asset metrics
    const newQuantity = this.calculateNewQuantity(asset.quantity, dto.amount, dto.type);
    const newAverageBuyPrice = this.calculateNewAverageBuyPrice(
      asset,
      dto.amount,
      dto.pricePerUnit,
      dto.type
    );
    const newValue = newQuantity * dto.pricePerUnit;

    // Create transaction record using Prisma.TransactionUncheckedCreateInput
    const transactionData: Prisma.TransactionUncheckedCreateInput = {
      portfolioId,
      assetId: asset.id,
      type: dto.type,
      cryptocurrency: dto.cryptocurrency.toUpperCase(),
      amount: dto.amount,
      pricePerUnit: dto.pricePerUnit,
      fee: dto.fee,
      exchange: dto.exchange,
      wallet: dto.wallet,
      notes: dto.notes,
      date: new Date()
    };

    // Create transaction record without relations first
    const transaction = await tx.transaction.create({
      data: transactionData,
    });


     // Update asset with new values
     await tx.asset.update({
      where: { id: asset.id },
      data: {
        quantity: newQuantity,
        averageBuyPrice: newAverageBuyPrice,
        currentPrice: dto.pricePerUnit, // Update current price with transaction price
        value: newValue,
        lastUpdated: new Date()
      }
    });


    // Update portfolio metrics to reflect new asset values
    await this.portfolioService.updatePortfolioMetrics(portfolioId, tx);

    // Fetch transaction with new relations at the end
    return await tx.transaction.findUnique({
      where: {
        id: transaction.id
      },
      include: {
        asset: true,
        portfolio: true
      }
    });
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
      sort?: string;
    },
  ): Promise<{ transactions: Transaction[]; total: number }> {
    // Parse sort parameter
    let orderBy: Prisma.TransactionOrderByWithRelationInput = {};
    if (options.sort) {
      const [field, direction] = options.sort.split(':');
      orderBy = { [field]: direction === 'desc' ? 'desc' : 'asc'};
    } else {
      // Default sorting
      orderBy = { date: 'desc' };
    }

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

    // Ensure limit is a valid number
    const take = Math.min(Math.max(1, Number(options.limit)), 100);
    const skip = (Number(options.page) - 1) * take;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          asset: true
        }
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { transactions, total };
  }

  private calculateNewQuantity(
    currentQuantity: number,
    transactionAmount: number,
    type: TransactionType
  ): number {
    switch (type) {
      case TransactionType.BUY:
      case TransactionType.TRANSFER_IN:
        return currentQuantity + transactionAmount;
      case TransactionType.SELL:
      case TransactionType.TRANSFER_OUT:
        return currentQuantity - transactionAmount;
      default:
        throw new BadRequestException('Invalid transaction type');
    }
  }

  private calculateNewAverageBuyPrice(
    asset: any,
    amount: number,
    price: number,
    type: TransactionType
  ): number {
    // Only update average buy price for buy transactions
    if (type !== TransactionType.BUY) {
      return asset.averageBuyPrice;
    }

    const totalCurrentValue = asset.quantity * asset.averageBuyPrice;
    const newValue = amount * price;
    const totalQuantity = asset.quantity + amount;

    return (totalCurrentValue + newValue) / totalQuantity;
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
}

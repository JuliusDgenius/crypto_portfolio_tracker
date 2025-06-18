import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { PrismaService } from '../../../database/src';
import { Portfolio, Asset, Transaction, Prisma } from '@prisma/client';
import { AddAssetDto, CreatePortfolioDto, UpdateAssetDto, UpdatePortfolioDto } from '../dto';
import { AnalyticsService } from './analytics.service';
import { PortfolioMetrics, ProfitLoss } from '../types/portfolio.types';

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);
  constructor(
    private prisma: PrismaService,
    private analyticsService: AnalyticsService,
  ) {
  }

  async createPortfolio(
    userId: string,
    dto: CreatePortfolioDto
  ): Promise<Portfolio> {
    // Verify user exists
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }

    const existingPortfolio = await this.prisma.portfolio.findFirst({
      where: {
        name: dto.name,
      }
    });

    if (existingPortfolio) {
      throw new ConflictException('Portfolio with this name already exists');
    }

    // default profitLoss structure
    const defaultProfitLoss: ProfitLoss = {
      day: 0,
      week: 0,
      month: 0,
      year: 0,
      allTime: 0,
      twentyFourHour: 0
    }

    const portfolioData = {
        name: dto.name.toLocaleUpperCase(),
        description: dto.description ?? null,
        totalValue: 0,
        lastUpdated: new Date(),
        userId: userId,
        profitLoss: defaultProfitLoss as unknown as Prisma.JsonValue
      
    };

    try {
      return this.prisma.portfolio.create({
        data: portfolioData
      });
    } catch(error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Portfolio name must be unique for this user');
        }
      }
      throw error;
    }
  }

  async updatePortfolio(
    userId: string, 
    portfolioId: string, 
    dto: UpdatePortfolioDto
  ): Promise<Portfolio> {
    const portfolio = await this.validatePortfolioAccess(userId, portfolioId);

    return this.prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        name: dto.name ?? portfolio.name,
        description: dto.description ?? portfolio.description,
        lastUpdated: new Date()
      }
    });
  }

  async deletePortfolio(userId: string, portfolioId: string): Promise<void> {
    await this.validatePortfolioAccess(userId, portfolioId);

    // Use transaction to ensure all related data is deleted
    await this.prisma.$transaction([
      this.prisma.transaction.deleteMany({
        where: { portfolioId }
      }),
      this.prisma.asset.deleteMany({
        where: { portfolioId }
      }),
      this.prisma.portfolio.delete({
        where: { id: portfolioId }
      })
    ]);
    console.log("Portfolio deleted");
  }

  async getPortfolios(userId: string): Promise<Portfolio[]> {
    // Fetch portfolios with their assets
    const portfolios = await this.prisma.portfolio.findMany({
      where: { userId },
      include: {
        assets: true
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Update any assets with null values
    for (const portfolio of portfolios) {
      for (const asset of portfolio.assets) {
        const updates: any = {};
        let needsUpdate = false;

        if (!asset.marketCap) {
          updates.marketCap = '0';
          needsUpdate = true;
        }
        if (!asset.category) {
          updates.category = 'Uncategorized';
          needsUpdate = true;
        }
        if (!asset.twentyFourHourChange) {
          updates.twentyFourHourChange = 0;
          needsUpdate = true;
        }
        if (!asset.profitLossPercentage) {
          updates.profitLossPercentage = 0;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await this.prisma.asset.update({
            where: { id: asset.id },
            data: {
              ...updates,
              lastUpdated: new Date()
            }
          });
        }
      }
    }

    return portfolios;
  }

  async getPortfoliosById(userId: string, portfolioId: string): Promise<Portfolio> {
    this.logger.debug(`Fetching portfolio with ID: ${portfolioId} for user: ${userId}`);
    
    if (!portfolioId) {
      this.logger.error('Portfolio ID is required');
      throw new NotFoundException('Portfolio ID is required');
    }

    if (!userId) {
      this.logger.error('User ID is required');
      throw new UnauthorizedException('User ID is required');
    }

    const portfolio = await this.prisma.portfolio.findFirst({
      where: {
        AND: [
          { id: portfolioId },
          { userId: userId }
        ]
      },
      include: {
        assets: true,
      },
    });

    if (!portfolio) {
      this.logger.error(`Portfolio not found with ID: ${portfolioId} for user: ${userId}`);
      throw new NotFoundException('Portfolio not found or you do not have permission to view it');
    }

    this.logger.debug(`Successfully found portfolio: ${portfolio.name}`);
    return portfolio;
  }

  async getPortfolioMetrics(portfolioId: string): Promise<PortfolioMetrics> {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: { assets: true },
    });

    if (!portfolio) {
      throw new ForbiddenException('Portfolio not found');
    }

    // Ensure profit/Loss exists
    const profitLoss = portfolio.profitLoss as unknown as ProfitLoss;
    if (profitLoss.twentyFourHour === undefined) {
      profitLoss.twentyFourHour = 0; // for backend compatibility
    }
    
    const assetAllocation = portfolio.assets.map(asset => ({
      symbol: asset.symbol,
      percentage: asset.allocation,
      value: asset.value,
    }));

    const performance = await this.analyticsService.calculatePerformanceMetrics(portfolioId);
    
    return {
      totalValue: portfolio.totalValue,
      profitLoss,
      assetAllocation,
      performance,
    };
  }

  // Asset Management (as part of Portfolio)
  async addAssetToPortfolio(
    userId: string,
    portfolioId: string,
    dto: AddAssetDto
  ): Promise<Asset> {
    await this.validatePortfolioAccess(userId, portfolioId);

    return this.prisma.$transaction(async (tx) => {
      const existingAsset = await tx.asset.findFirst({
        where: {
          portfolioId,
          symbol: dto.symbol.toUpperCase()
        }
      });

      if (existingAsset) {
        throw new ConflictException('Asset already exists in portfolio');
      }

      // Calculate initial value
      const initialValue = dto.quantity * dto.currentPrice;

      const createAssetData: Prisma.AssetUncheckedCreateInput = {
        portfolioId,
        symbol: dto.symbol.toUpperCase(),
        name: dto.name,
        quantity: dto.quantity,
        currentPrice: dto.currentPrice,
        averageBuyPrice: dto.averageBuyPrice || dto.currentPrice,
        value: initialValue,
        profitLoss: initialValue - (dto.quantity * (dto.averageBuyPrice || dto.currentPrice)),
        allocation: 0, // Will be updated after creation
        category: dto.category || 'Uncategorized',
        marketCap: dto.marketCap || '0',
        twentyFourHourChange: dto.twentyFourHourChange || 0,
        profitLossPercentage: dto.averageBuyPrice ? 
          ((dto.currentPrice - dto.averageBuyPrice) / dto.averageBuyPrice) * 100 : 0,
        lastUpdated: new Date()
      };

      // Create the asset
      const asset = await tx.asset.create({
        data: createAssetData
      });

      // Get all assets including the newly created one
      const allAssets = await tx.asset.findMany({
        where: { portfolioId }
      });

      // Calculate total portfolio value
      const totalValue = allAssets.reduce((sum, a) => sum + a.value, 0);

      // Update the new asset's allocation
      const allocation = totalValue === 0 ? 0 : (initialValue / totalValue) * 100;
      
      // Update the asset with the correct allocation
      const updatedAsset = await tx.asset.update({
        where: { id: asset.id },
        data: { allocation }
      });

      // Update portfolio total value
      await tx.portfolio.update({
        where: { id: portfolioId },
        data: {
          totalValue,
          lastUpdated: new Date()
        }
      });

      return updatedAsset;
    });
  }

  async updateAssetInPortfolio(
    userId: string,
    portfolioId: string,
    assetId: string,
    dto: UpdateAssetDto
  ): Promise<Asset> {
    await this.validatePortfolioAccess(userId, portfolioId);
    
    return this.prisma.$transaction(async (tx) => {
        const asset = await tx.asset.findFirst({
            where: {
                id: assetId,
                portfolioId
            }
        });

        if (!asset) {
          throw new NotFoundException('Asset not found in portfolio');
      }

    const updatedAsset = await tx.asset.update({
        where: { id: assetId },
        data: {
            name: dto.name ?? asset.name,
            quantity: dto.quantity ?? asset.quantity,
            averageBuyPrice: dto.averageBuyPrice ?? asset.averageBuyPrice,
            value: dto.value ?? asset.value,
            lastUpdated: new Date()
        }
    });

    await this.updatePortfolioMetrics(portfolioId);

        return updatedAsset;
    });
  }

  async deleteAsset(
    userId: string,
    portfolioId: string,
    assetId: string
  ): Promise<void> {
    await this.validatePortfolioAccess(userId, portfolioId);
    
    return this.prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findFirst({
        where: {
          id: assetId,
          portfolioId
        }
      });

      if (!asset) {
        throw new NotFoundException('Asset not found in portfolio');
      }

      // Delete all transactions associated with this asset
      await tx.transaction.deleteMany({
        where: { assetId }
      });

      // Delete the asset
      await tx.asset.delete({
        where: { id: assetId }
      });

      // Update portfolio metrics after asset deletion
      await this.updatePortfolioMetrics(portfolioId, tx);
    });
  }

  // Internal methods that can be used by TransactionService
  async getOrCreateAsset(
    portfolioId: string,
    symbol: string,
    name: string
  ): Promise<Asset> {
    const asset = await this.prisma.asset.findFirst({
      where: {
        portfolioId,
        symbol: symbol.toUpperCase()
      }
    });

    if (asset) return asset;

    const defaultAssetData: Prisma.AssetUncheckedCreateInput = {
      symbol: symbol.toUpperCase(),
      name,
      quantity: 0,
      currentPrice: 0,
      averageBuyPrice: 0,
      value: 0,
      allocation: 0,
      portfolioId,
      profitLoss: 0,
      category: null,
      marketCap: null,
      twentyFourHourChange: 0,
      profitLossPercentage: 0,
      lastUpdated: new Date()
    };

    return this.prisma.asset.create({
      data: defaultAssetData
    });
  }
        

async validatePortfolioAccess(
  userId: string, 
  portfolioId: string
): Promise<Portfolio> {
  const portfolio = await this.prisma.portfolio.findFirst({
    where: {
      AND: [
        { id: portfolioId },
        { userId: userId }
      ]
    }
  });

  if (!portfolio) {
    throw new NotFoundException('Portfolio not found');
  }

  if (portfolio.userId !== userId) {
    throw new ForbiddenException("Access denied");
  }

  return portfolio;
}

async setPrimaryPortfolio(userId: string, portfolioId: string): Promise<Portfolio> {
  // First validate access
  await this.validatePortfolioAccess(userId, portfolioId);

  // Use transaction to ensure atomicity
  return this.prisma.$transaction(async (tx) => {
    // First, ensure all portfolios have isPrimary field set to false
    await tx.portfolio.updateMany({
      where: { 
        userId,
        isPrimary: { not: false } // This will match both undefined and true
      },
      data: { 
        isPrimary: false 
      }
    });

    // Set the selected portfolio as primary
    return tx.portfolio.update({
      where: { id: portfolioId },
      data: { isPrimary: true }
    });
  });
}

async updatePortfolioMetrics(
  portfolioId: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const BATCH_SIZE = 10 // Implement batching to prevent parallel write issues while maintaining performance

  const prismaCLient = tx || this.prisma
  const assets = await prismaCLient.asset.findMany({
    where: { portfolioId }
  });
  
  this.logger.debug('Updating portfolio metrics:', {
    portfolioId,
    assetCount: assets.length,
    assets: assets.map(a => ({
      symbol: a.symbol,
      value: a.value,
      quantity: a.quantity,
      currentPrice: a.currentPrice
    }))
  });

  // Calculate total value of assets in the portfolio
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  
  this.logger.debug('Portfolio total value:', totalValue);
 
  // Update allocations based on new total value
  for (let i = 0; i < assets.length; i += BATCH_SIZE) {
    const batch = assets.slice(i, i + BATCH_SIZE);

    for (const asset of batch) {
      const allocation = totalValue === 0 ? 0 : (asset.value / totalValue) * 100;
      this.logger.debug(`Calculating allocation for ${asset.symbol}:`, {
        value: asset.value,
        totalValue,
        allocation
      });

      await prismaCLient.asset.update({
        where: { id: asset.id },
        data: {
          allocation
        }
      });
    }
  }

  await prismaCLient.portfolio.update({
    where: { id: portfolioId },
    data: {
      totalValue,
      lastUpdated: new Date()
    }
  });

  this.logger.debug('Portfolio metrics updated successfully');
}
}

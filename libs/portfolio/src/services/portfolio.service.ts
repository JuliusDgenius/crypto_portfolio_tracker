import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { PrismaService } from '../../../database/src';
import { Portfolio, Asset, Transaction, Prisma } from '@prisma/client';
import { AddAssetDto, CreatePortfolioDto, UpdateAssetDto, UpdatePortfolioDto } from '../dto';
import { AnalyticsService } from './analytics.service';
import { PortfolioMetrics, ProfitLoss } from '../types/portfolio.types';
import { count } from 'console';

@Injectable()
export class PortfolioService {
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
    }

    const portfolioData = {
        name: dto.name,
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
    return this.prisma.portfolio.findMany({
      where: { userId },
      include: {
        assets: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getPortfoliosById(userId: string, portfolioId: string): Promise<Portfolio> {
    return this.prisma.portfolio.findFirstOrThrow({
      where: {
        userId,
        id: portfolioId 
      },
      include: {
        assets: true,
      },
    });
  }

  async getPortfolioMetrics(portfolioId: string): Promise<PortfolioMetrics> {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: { assets: true },
    });

    if (!portfolio) {
      throw new ForbiddenException('Portfolio not found');
    }

    const profitLoss = portfolio.profitLoss as unknown as ProfitLoss;
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

      const createAssetData: Prisma.AssetUncheckedCreateInput = {
        portfolioId,
        symbol: dto.symbol.toUpperCase(),
        name: dto.name,
        quantity: 0,
        currentPrice: 0,
        averageBuyPrice: 0,
        value: 0,
        profitLoss: 0,
        allocation: 0,
        lastUpdated: new Date() 
      };

      const asset = await tx.asset.create({
          data: createAssetData
      });

      await this.updatePortfolioMetrics(portfolioId);

            return asset;
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
      throw new ForbiddenException("Acces denied");
    }

    return portfolio;
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
    
    // Calculate total value of assets in the portfolio
    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
   
      // Update allocations based on new total value
      for (let i = 0; i < assets.length; i += BATCH_SIZE) {
        const batch = assets.slice(i, i + BATCH_SIZE);

        for (const asset of batch) {
          await prismaCLient.asset.update({
            where: { id: asset.id },
              data: {
                allocation: totalValue === 0 ? 0 : (asset.value / totalValue) * 100
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
  }
}

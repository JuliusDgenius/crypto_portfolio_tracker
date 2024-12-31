import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../database/src';
import { Portfolio, Asset, Transaction, Prisma } from '@prisma/client';
import { CreatePortfolioDto, UpdatePortfolioDto } from '../dto';
import { AnalyticsService } from './analytics.service';
import { PortfolioMetrics, ProfitLoss } from '../types/portfolio.types';

@Injectable()
export class PortfolioService {
  constructor(
    private prisma: PrismaService,
    private analyticsService: AnalyticsService,
  ) {}

  async createPortfolio(
    userId: string,
    dto: CreatePortfolioDto
  ): Promise<Portfolio> {
    // Verify user exists
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
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
        // Handle specific Prisma errors
        if (error.code === 'P2002') {
          throw new ForbiddenException('Portfolio name must be unique for this user');
        }
      }
      throw error;
    }
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
}

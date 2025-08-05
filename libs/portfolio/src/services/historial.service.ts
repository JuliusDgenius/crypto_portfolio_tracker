import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/src';
import { ConfigService } from '@nestjs/config';
import { CreateHistoricalDataDto } from '../dto/create-historical-data.dto';
import { JsonObject } from '@prisma/client/runtime/library';

@Injectable()
export class HistoricalDataService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Creates a new historical data point for a portfolio
   */
  async createHistoricalDataPoint(createHistoricalDataDto: CreateHistoricalDataDto) {
    return this.prisma.historicalData.create({
      data: {
        portfolioId: createHistoricalDataDto.portfolioId,
        date: createHistoricalDataDto.date,
        totalValue: createHistoricalDataDto.totalValue,
        assets: createHistoricalDataDto.assets as unknown as JsonObject, // Stored as JSON
      },
    });
  }

  /**
   * Retrieves historical data for a portfolio within a date range
   */
  async getPortfolioHistory(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    interval: 'daily' | 'weekly' | 'monthly' = 'daily',
  ) {
    const data = await this.prisma.historicalData.findMany({
      where: {
        portfolioId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Apply interval filtering if needed
    return this.filterByInterval(data, interval);
  }

  async getHistoricalValue(portfolioId: string, date: Date) {
    const data = await this.prisma.historicalData.findFirst({
      where: {
        portfolioId,
        date: date,
      },
      select: {
        totalValue: true,
      },
    });
    return data;
  } 

  /**
   * Filters historical data points based on the specified interval
   */
  private filterByInterval(
    data: any[],
    interval: 'daily' | 'weekly' | 'monthly',
  ) {
    if (interval === 'daily') return data;

    const intervalMap = {
      weekly: 7,
      monthly: 30,
    };

    const daysInterval = intervalMap[interval];
    let lastIncludedDate = null;

    return data.filter((point) => {
      if (!lastIncludedDate) {
        lastIncludedDate = point.date;
        return true;
      }

      const daysDiff = Math.floor(
        (point.date - lastIncludedDate) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff >= daysInterval) {
        lastIncludedDate = point.date;
        return true;
      }

      return false;
    });
  }

  /**
   * Updates portfolio's historical data (typically called by a scheduled job)
   */
  async updatePortfolioHistory(portfolioId: string) {
    // Get current portfolio state
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: { assets: true },
    });

    if (!portfolio) return null;

    // Create historical data point
    const assetSnapshots = portfolio.assets.map((asset) => ({
      symbol: asset.symbol,
      quantity: asset.quantity,
      price: asset.currentPrice,
      value: asset.value,
      allocation: asset.allocation,
    }));

    return this.createHistoricalDataPoint({
      portfolioId,
      date: new Date(),
      totalValue: portfolio.totalValue,
      assets: assetSnapshots,
    });
  }

  /**
   * Retrieves historical price data for a specific asset
   */
  async getAssetHistory(symbol: string) {
    const data = await this.prisma.historicalData.findMany({
      orderBy: {
        date: 'asc'
      },
      select: {
        date: true,
        assets: true
      }
    });

    // Filter and extract price data for the specific asset
    return data
      .map(point => {
        const assetData = (point.assets as any[]).find(asset => asset.symbol === symbol);
        if (!assetData) return null;
        return {
          date: point.date,
          price: assetData.price || 0
        };
      })
      .filter(point => point !== null);
  }
}
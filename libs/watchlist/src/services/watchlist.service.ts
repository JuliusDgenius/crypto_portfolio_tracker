import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException } from '@nestjs/common';
import {
    CreateWatchlistDto,
    UpdateWatchlistDto,
    AddAssetDto } from '../dto';
import { PrismaService } from '../../../database/src';
import { Watchlist, Prisma } from '@prisma/client';
import { PriceService } from '../../../crypto/src/services/price.service';
import { WatchlistMetrics } from '../types/watchlist.types';

@Injectable()
export class WatchlistService {
  constructor(
    private prisma: PrismaService,
    private priceService: PriceService,
  ) {}

  async createWatchlist(
      userId: string,
      dto: CreateWatchlistDto
    ): Promise<Watchlist> {
      const existingWatchlist = await this.prisma.watchlist.findFirst({
        where: {
        userId,
        name: dto.name,
     },
    });

    if (existingWatchlist) {
      throw new ConflictException('Watchlist with this name already exists');
    }

    return this.prisma.watchlist.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        cryptocurrencies: [], // Initialize empty
        assetIds: [],
        alertIds: [],
      },
    });
  }

  async updateWatchlist(
    userId: string,
    watchlistId: string,
    dto: UpdateWatchlistDto,
  ): Promise<Watchlist> {
    await this.validateWatchlistAccess(userId, watchlistId);

    return this.prisma.watchlist.update({
      where: { id: watchlistId },
      data: {
        name: dto.name,
        description: dto.description,
        updatedAt: new Date(),
      },
    });
  }

  async deleteWatchlist(
    userId: string, watchlistId: string
  ): Promise<void> {
    await this.validateWatchlistAccess(userId, watchlistId);

    await this.prisma.$transaction([
      // Remove references from alerts
      this.prisma.alert.updateMany({
        where: { watchlistIds: { has: watchlistId } },
        data: { 
          watchlistIds: {
            set: []
          }
        },
      }),
      // Delete the watchlist
      this.prisma.watchlist.delete({
        where: { id: watchlistId },
      }),
    ]);
  }

  async addAssetToWatchlist(
    userId: string,
    watchlistId: string,
    dto: AddAssetDto,
  ): Promise<Watchlist> {
    const watchlist = await this.validateWatchlistAccess(
        userId, watchlistId
    );
    
    // Check if asset already exists in watchlist
    const cryptocurrencies = watchlist.cryptocurrencies as any[];
    if (cryptocurrencies.some(c => c.symbol === dto.symbol.toUpperCase())) {
      throw new ConflictException('Asset already in watchlist');
    }

    // Get current price and info
    const assetInfo = await this.priceService.getAssetInfo(dto.symbol);

    return this.prisma.watchlist.update({
      where: { id: watchlistId },
      data: {
        cryptocurrencies: {
          push: {
            symbol: dto.symbol.toUpperCase(),
            name: assetInfo.name,
            currentPrice: assetInfo.price,
            addedAt: new Date(),
          },
        },
      },
      include: {
        watchedAssets: true,
        alerts: true,
      },
    });
  }

  async removeAssetFromWatchlist(
    userId: string,
    watchlistId: string,
    symbol: string,
  ): Promise<Watchlist> {
    const watchlist = await this.validateWatchlistAccess(userId, watchlistId);
    
    const cryptocurrencies = watchlist.cryptocurrencies as any[];
    const updatedCryptocurrencies = cryptocurrencies.filter(
      c => c.symbol !== symbol.toUpperCase(),
    );

    return this.prisma.watchlist.update({
      where: { id: watchlistId },
      data: {
        cryptocurrencies: updatedCryptocurrencies,
      },
      include: {
        watchedAssets: true,
        alerts: true,
      },
    });
  }

  async getWatchlists(userId: string): Promise<Watchlist[]> {
    return this.prisma.watchlist.findMany({
      where: { userId },
      include: {
        watchedAssets: true,
        alerts: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async getWatchlistById(
    userId: string, watchlistId: string
  ): Promise<Watchlist> {
    return this.validateWatchlistAccess(userId, watchlistId);
  }

  async getWatchlistMetrics(
    userId: string, watchlistId: string
  ): Promise<WatchlistMetrics> {
    const watchlist = await this.validateWatchlistAccess(userId, watchlistId);
    const cryptocurrencies = watchlist.cryptocurrencies as any[];

    // Update current prices
    const updatedCryptos = await Promise.all(
      cryptocurrencies.map(async (crypto) => {
        const priceInfo = await this.priceService.getAssetInfo(crypto.symbol);
        return {
          ...crypto,
          currentPrice: priceInfo.price,
        };
      }),
    );

    // Sort by price performance
    const sortedByPerformance = [...updatedCryptos].sort(
        (a, b) => b.currentPrice - a.currentPrice,
      );
  
      // Sort by recently added
      const sortedByDate = [...updatedCryptos].sort(
        (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
      );
  
      return {
        totalAssets: cryptocurrencies.length,
        topPerformers: sortedByPerformance.slice(0, 5),
        recentlyAdded: sortedByDate.slice(0, 5),
        alerts: watchlist.alertIds.length,
      };
    }

    private async validateWatchlistAccess(
        userId: string,
        watchlistId: string,
      ): Promise<Watchlist> {
        const watchlist = await this.prisma.watchlist.findFirst({
          where: {
            AND: [{ id: watchlistId }, { userId }],
          },
          include: {
            watchedAssets: true,
            alerts: true,
          },
        });
    
        if (!watchlist) {
          throw new NotFoundException('Watchlist not found');
        }
    
        if (watchlist.userId !== userId) {
          throw new ForbiddenException('Access denied');
        }
    
        return watchlist;
    }
}
    
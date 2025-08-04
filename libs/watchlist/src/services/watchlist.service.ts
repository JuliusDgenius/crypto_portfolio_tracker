import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    Logger,
    ConflictException } from '@nestjs/common';
import {
    CreateWatchlistDto,
    UpdateWatchlistDto,
    AddAssetDto } from '../dto';
import { PrismaService } from '../../../database/src';
import { Watchlist, Prisma } from '@prisma/client';
import { PriceService } from '../../../crypto/src/services/price.service';
import { WatchlistAsset, WatchlistMetrics } from '../types/watchlist.types';

@Injectable()
export class WatchlistService {
  private readonly logger = new Logger(WatchlistService.name);

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
      // Delete all items associated with watchlist
      this.prisma.watchlistItem.deleteMany({
        where: {watchlistId: watchlistId}
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
    this.logger.debug(`Returned watchlist: ${JSON.stringify(watchlist)}`);
    const trimmedSymbol = dto.symbol.trim();
    
    // Check if asset already exists in watchlist
    const asset = await this.prisma.asset.findUnique({
      where: { id: trimmedSymbol },
    });
    if (!asset) {
      // TODO: If asset not found, perhaps trigger a fetch from an external API and store it
      // For now, we'll throw an error.
      throw new NotFoundException(`Asset with ID ${dto.symbol} not found.`);
    }

    const assetId = asset.id;

    // Check if asset already exists in watchlist via WatchlistItem
    const existingWatchlistItem = await this.prisma.watchlistItem.findFirst({
      where: { watchlistId, assetId }
    });
    if (existingWatchlistItem) {
      throw new ConflictException('Asset already in this watchlist');
    }

    // Create the WatchlistItem
    await this.prisma.watchlistItem.create({
      data: {
        watchlistId,
        assetId,
        notes: dto.notes,
      }
    });

    return this.prisma.watchlist.findUnique({
      where: { id: watchlistId },
      include: {
        items: {
          include: {
            asset: true,
          },
        },
        alerts: true,
      },
    });
  }

  async removeAssetFromWatchlist(
    userId: string,
    watchlistId: string,
    assetId: string,
  ): Promise<Watchlist> {
    await this.validateWatchlistAccess(userId, watchlistId);
    
    const watchlistItemToDelete = await this.prisma.watchlistItem.findFirst({
      where: {
        watchlistId, assetId,
      }
    });
    if (!watchlistItemToDelete) {
      throw new NotFoundException('Asset not found in this watchlist');
    }

    await this.prisma.watchlistItem.delete({
      where: { id: watchlistItemToDelete.id },
    });

    // Return updated watchlist items with their assets
    return this.prisma.watchlist.findUnique({
      where: { id: watchlistId },
      include: {
        items: {
          include: {
            asset: true,
          },
        },
        alerts: true,
      },
    });
  }

  async getWatchlists(userId: string): Promise<Watchlist[]> {
    return this.prisma.watchlist.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            asset: true,
          },
        },
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

    // Extract asset details from watchlist .items
    const assetsInWatchlist: WatchlistAsset[] = watchlist.items.map(
      (item) => ({
        id: item.asset.id,
        symbol: item.asset.symbol,
        name: item.asset.name,
        currentPrice: item.asset.currentPrice,
        addedAt: item.createdAt
      })
    );

    // Update current prices for metrics
    const updatedAssets = await Promise.all(
      assetsInWatchlist.map(async (assetDetail) => {
        const priceInfo = await this.priceService.getAssetInfo(
          assetDetail.symbol,
        );
        return {
          ...assetDetail,
          currentPrice: priceInfo.price,
        };
      }),
    );

    // Sort by price performance
    const sortedByPerformance = [...updatedAssets].sort(
      (a, b) => b.currentPrice - a.currentPrice,
    );

    // refetch with `createdAt` from `WatchlistItem` to enable this sorting by recently.
    const watchlistWithItemDates = await this.prisma.watchlist.findUnique({
      where: { id: watchlistId },
      include: {
        items: {
          include: {
            asset: true,
          },
          orderBy: {
            createdAt: 'desc', // Order WatchlistItems by creation date
          },
        },
      },
    });

    const recentlyAddedAssets: WatchlistAsset[] =
      watchlistWithItemDates?.items.map((item) => ({
        id: item.asset.id,
        symbol: item.asset.symbol,
        name: item.asset.name,
        currentPrice: item.asset.currentPrice,
      })) || [];

  
      return {
        totalAssets: assetsInWatchlist.length,
        topPerformers: sortedByPerformance.slice(0, 5),
        recentlyAdded: recentlyAddedAssets.slice(0, 5),
        alerts: watchlist.alerts.length,
      };
    }

    private async validateWatchlistAccess(
        userId: string,
        watchlistId: string,
      ): Promise<Watchlist & { items: 
          (Prisma.WatchlistItemGetPayload<{ include: { asset: true } }> 
          & { asset: { id: string, symbol: string, name: string, currentPrice: number } })[]; 
          alerts: Prisma.AlertGetPayload<{}>[]; }> {
        const watchlist = await this.prisma.watchlist.findFirst({
          where: {
            AND: [{ id: watchlistId }, { userId }],
          },
          include: {
            items: {
              include: {
                asset: true,
              },
            },
            alerts: true,
          },
        });
    
        if (!watchlist) {
          throw new NotFoundException('Watchlist not found');
        }
    
        if (watchlist.userId !== userId) {
          throw new ForbiddenException('Access denied');
        }
    
        // This cast helps satisfy the return type based on the include.
        // TODO: In a real application, you might define more specific types.
        return watchlist as Watchlist & 
          { items: (Prisma.WatchlistItemGetPayload<{ include: { asset: true } }> & 
          { asset: { id: string, symbol: string, name: string, currentPrice: number } })[]; 
          alerts: Prisma.AlertGetPayload<{}>[]; };
    }
}
    
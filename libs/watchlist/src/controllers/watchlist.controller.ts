import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/src/guards';
import { CurrentUser } from '../../../auth/src/decorators';
import { WatchlistService } from '../services/watchlist.service';
import {
  CreateWatchlistDto,
  UpdateWatchlistDto,
  AddAssetDto,
} from '../dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam,
  ApiBody, ApiSecurity } from '@nestjs/swagger';

@ApiTags('watchlists')
@ApiSecurity('JWT-auth')
@Controller('watchlists')
@UseGuards(JwtAuthGuard)
export class WatchlistController {
  constructor(private watchlistService: WatchlistService) {}

  @Post('create')
  @ApiOperation({ 
    summary: 'Create a new watchlist',
    description: 'Creates a new watchlist for the authenticated user' 
  })
  @ApiBody({ 
    type: CreateWatchlistDto,
    examples: {
      watchlist: {
        value: {
          name: "Tech Stocks",
          description: "Top technology companies",
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Watchlist created successfully',
    schema: {
      example: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Tech Stocks",
        description: "Top technology companies",
        assets: [],
        createdAt: "2024-01-03T12:00:00Z",
        updatedAt: "2024-01-03T12:00:00Z"
      }
    }
  })
  async createWatchlist(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWatchlistDto,
  ) {
    return this.watchlistService.createWatchlist(userId, dto);
  }

  @Put(':id/update')
  @ApiOperation({ summary: 'Update a watchlist' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({ 
    type: UpdateWatchlistDto,
    examples: {
      update: {
        value: {
          name: "Updated Tech Stocks",
          description: "Updated description",
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK,
    schema: {
      example: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Updated Tech Stocks",
        description: "Updated description",
        updatedAt: "2024-01-03T12:00:00Z"
      }
    }
  })
  async updateWatchlist(
    @CurrentUser('id') userId: string,
    @Param('id') watchlistId: string,
    @Body() dto: UpdateWatchlistDto,
  ) {
    return this.watchlistService.updateWatchlist(userId, watchlistId, dto);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Delete a watchlist' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteWatchlist(
    @CurrentUser('id') userId: string,
    @Param('id') watchlistId: string,
  ) {
    return this.watchlistService.deleteWatchlist(userId, watchlistId);
  }

  @Post(':id/assets')
  @ApiOperation({ summary: 'Add an asset to watchlist' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({ 
    type: AddAssetDto,
    examples: {
      addAsset: {
        value: {
          symbol: 'BTC',
          notes: 'Consider buying if price drops to $150'
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK,
    schema: {
      example: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        items: [{id: 'watchlistItemObjectId',
          watchlistId: '550e8400-e29b-41d4-a716-446655440000',
          notes: 'Consider buying if price drops to $150',
          createdAt: '2024-01-03T12:00:00Z',
          asset: {
            // Full asset object details
            id: 'someAssetObjectId',
            symbol: 'BTC',
            name: 'Bitcoin',
            quantity: 0,
            averageBuyPrice: 0,
            currentPrice: 40000,
            value: 0,
            profitLoss: 0,
            allocation: 0,
            lastUpdated: '2024-01-03T12:00:00Z',
            portfolioId: 'somePortfolioId',
          },
        },]
      }
    }
  })
  async addAssetToWatchlist(
    @CurrentUser('id') userId: string,
    @Param('id') watchlistId: string,
    @Body() dto: AddAssetDto,
  ) {
    return this.watchlistService.addAssetToWatchlist(userId, watchlistId, dto);
  }

  @Delete(':id/assets/:assetId')
  @ApiOperation({ summary: 'Remove an asset from watchlist' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiParam({ name: 'assetId', example: 'someAssetObjectId' })
  @ApiResponse({ status: HttpStatus.OK })
  async removeAssetFromWatchlist(
    @CurrentUser('id') userId: string,
    @Param('id') watchlistId: string,
    @Param('assetId') assetId: string,
  ) {
    return this.watchlistService.removeAssetFromWatchlist(userId, watchlistId, assetId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all watchlists' })
  @ApiResponse({ 
    status: HttpStatus.OK,
    schema: {
      example: [{
        id: "550e8400-e29b-41d4-a716-446655440000",
        watchlistId: '550e8400-e29b-41d4-a716-446655440000',
        name: "Tech Stocks",
        description: "Top technology companies",
        items: [
          {
              id: 'watchlistItemObjectId',
              watchlistId: '550e8400-e29b-41d4-a716-446655440000',
              assetId: 'someAssetObjectId',
              notes: 'Potential breakout',
              createdAt: '2024-01-03T12:00:00Z',
              asset: {
                id: 'someAssetObjectId',
                symbol: 'AAPL',
                name: 'Apple Inc.',
                currentPrice: 150.0,
              },
          },
      ],
      createdAt: '2024-01-03T12:00:00Z',
      updatedAt: '2024-01-03T12:00:00Z',
    },
  ],
}
  })
  async getWatchlists(@CurrentUser('id') userId: string) {
    return this.watchlistService.getWatchlists(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get watchlist by ID' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Tech Stocks',
        items: [
          {
            id: 'watchlistItemObjectId',
            watchlistId: '550e8400-e29b-41d4-a716-446655440000',
            assetId: 'someAssetObjectId',
            notes: 'Potential breakout',
            createdAt: '2024-01-03T12:00:00Z',
            asset: {
              id: 'someAssetObjectId',
              symbol: 'AAPL',
              name: 'Apple Inc.',
              currentPrice: 150.0,
            },
          },
        ],
      },
    },
  })
  async getWatchlistById(
    @CurrentUser('id') userId: string,
    @Param('id') watchlistId: string,
  ) {
    return this.watchlistService.getWatchlistById(userId, watchlistId);
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Get watchlist metrics' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ 
    status: HttpStatus.OK,
    schema: {
      example: {
        totalAssets: 1,
        totalValue: 15000.00,
        dailyChange: 2.5,
        topPerformers: ["AAPL"],
        worstPerformers: []
      }
    }
  })
  async getWatchlistMetrics(
    @CurrentUser('id') userId: string,
    @Param('id') watchlistId: string,
  ) {
    return this.watchlistService.getWatchlistMetrics(userId, watchlistId);
  }
}
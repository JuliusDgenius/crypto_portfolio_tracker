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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

@ApiTags('watchlists')
@ApiSecurity('JWT-auth')
@Controller('watchlists')
@UseGuards(JwtAuthGuard)
export class WatchlistController {
  constructor(private watchlistService: WatchlistService) {}

  @Post()
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
          isPublic: true
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
        isPublic: true,
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

  @Put(':id')
  @ApiOperation({ summary: 'Update a watchlist' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({ 
    type: UpdateWatchlistDto,
    examples: {
      update: {
        value: {
          name: "Updated Tech Stocks",
          description: "Updated description",
          isPublic: false
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
        isPublic: false,
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a watchlist' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: HttpStatus.OK })
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
      asset: {
        value: {
          symbol: "AAPL",
          notes: "Potential breakout",
          alertPrice: 150.00
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK,
    schema: {
      example: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        assets: [{
          symbol: "AAPL",
          notes: "Potential breakout",
          alertPrice: 150.00,
          addedAt: "2024-01-03T12:00:00Z"
        }]
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

  @Delete(':id/assets/:symbol')
  @ApiOperation({ summary: 'Remove an asset from watchlist' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiParam({ name: 'symbol', example: 'AAPL' })
  @ApiResponse({ status: HttpStatus.OK })
  async removeAssetFromWatchlist(
    @CurrentUser('id') userId: string,
    @Param('id') watchlistId: string,
    @Param('symbol') symbol: string,
  ) {
    return this.watchlistService.removeAssetFromWatchlist(userId, watchlistId, symbol);
  }

  @Get()
  @ApiOperation({ summary: 'Get all watchlists' })
  @ApiResponse({ 
    status: HttpStatus.OK,
    schema: {
      example: [{
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Tech Stocks",
        description: "Top technology companies",
        isPublic: true,
        assets: [{
          symbol: "AAPL",
          notes: "Potential breakout",
          alertPrice: 150.00,
          addedAt: "2024-01-03T12:00:00Z"
        }],
        createdAt: "2024-01-03T12:00:00Z",
        updatedAt: "2024-01-03T12:00:00Z"
      }]
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
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Tech Stocks",
        assets: [{
          symbol: "AAPL",
          notes: "Potential breakout",
          alertPrice: 150.00,
          addedAt: "2024-01-03T12:00:00Z"
        }]
      }
    }
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
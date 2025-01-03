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
  import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
  
  @ApiTags('watchlists')
  @Controller('watchlists')
  @UseGuards(JwtAuthGuard)
  export class WatchlistController {
    constructor(private watchlistService: WatchlistService) {}
  
    @Post()
    @ApiOperation({ summary: 'Create a new watchlist' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Watchlist created successfully' })
    async createWatchlist(
      @CurrentUser('id') userId: string,
      @Body() dto: CreateWatchlistDto,
    ) {
      return this.watchlistService.createWatchlist(userId, dto);
    }
  
    @Put(':id')
    @ApiOperation({ summary: 'Update a watchlist' })
    async updateWatchlist(
      @CurrentUser('id') userId: string,
      @Param('id') watchlistId: string,
      @Body() dto: UpdateWatchlistDto,
    ) {
      return this.watchlistService.updateWatchlist(userId, watchlistId, dto);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a watchlist' })
    async deleteWatchlist(
      @CurrentUser('id') userId: string,
      @Param('id') watchlistId: string,
    ) {
      return this.watchlistService.deleteWatchlist(userId, watchlistId);
    }
  
    @Post(':id/assets')
    @ApiOperation({ summary: 'Add an asset to watchlist' })
    async addAssetToWatchlist(
      @CurrentUser('id') userId: string,
      @Param('id') watchlistId: string,
      @Body() dto: AddAssetDto,
    ) {
      return this.watchlistService.addAssetToWatchlist(userId, watchlistId, dto);
    }
  
    @Delete(':id/assets/:symbol')
    @ApiOperation({ summary: 'Remove an asset from watchlist' })
    async removeAssetFromWatchlist(
      @CurrentUser('id') userId: string,
      @Param('id') watchlistId: string,
      @Param('symbol') symbol: string,
    ) {
      return this.watchlistService.removeAssetFromWatchlist(userId, watchlistId, symbol);
    }
  
    @Get()
    @ApiOperation({ summary: 'Get all watchlists' })
    async getWatchlists(@CurrentUser('id') userId: string) {
      return this.watchlistService.getWatchlists(userId);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get watchlist by ID' })
    async getWatchlistById(
      @CurrentUser('id') userId: string,
      @Param('id') watchlistId: string,
    ) {
      return this.watchlistService.getWatchlistById(userId, watchlistId);
    }
  
    @Get(':id/metrics')
    @ApiOperation({ summary: 'Get watchlist metrics' })
    async getWatchlistMetrics(
      @CurrentUser('id') userId: string,
      @Param('id') watchlistId: string,
    ) {
      return this.watchlistService.getWatchlistMetrics(userId, watchlistId);
    }
  }
  
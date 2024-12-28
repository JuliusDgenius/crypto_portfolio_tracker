import { Controller, Get, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MarketService } from '../services/market.service';
import { IMarketData } from '../interfaces';

@ApiTags('Market Data')
@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get(':symbol')
  @ApiOperation({ summary: 'Get market data for a specific cryptocurrency' })
  @ApiParam({ name: 'symbol', description: 'Cryptocurrency symbol (e.g., bitcoin, ethereum)' })
  @ApiResponse({ status: 200, description: 'Market data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Cryptocurrency not found' })
  async getMarketData(@Param('symbol') symbol: string): Promise<IMarketData> {
    try {
      console.log("I am hit with", symbol);
      return await this.marketService.getMarketData(symbol.toLowerCase());
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException('Cryptocurrency not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Failed to fetch market data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
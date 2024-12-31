import {
  Controller,
  Get, Query,
  ValidationPipe,
  HttpException,
  HttpStatus,
  Param, Body,
  Post
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam
} from '@nestjs/swagger';
import { PriceService } from '../services';
import { ICryptoPrice } from '../interfaces';
import { GetPricesDto } from '../dto/get-prices.dto';

/**
 * Controller for handling cryptocurrency price requests.
 */
@ApiTags('Cryptocurrency Prices')
@Controller('prices')
export class PriceController {
  
  /**
   * Creates an instance of PriceController.
   * @param priceService - The service for fetching cryptocurrency prices.
   */
  constructor(private readonly priceService: PriceService) {}

  /**
   * Retrieves prices for multiple cryptocurrencies.
   * @param query - The query parameters containing the symbols of cryptocurrencies.
   * @returns A promise that resolves to an array of ICryptoPrice objects.
   * @throws HttpException if the request fails.
   */
  @Get()
  @ApiOperation({ summary: 'Get prices for multiple cryptocurrencies' })
  @ApiQuery({ 
    name: 'symbols', 
    description: 'Comma-separated list of cryptocurrency symbols',
    example: 'bitcoin,ethereum,binancecoin'
  })
  @ApiResponse({ status: 200, description: 'Prices retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  async getPrices(
    @Query(new ValidationPipe({ transform: true })) query: GetPricesDto
  ): Promise<ICryptoPrice[]> {
    console.log("I am hit with: ", query);
    try {
      const symbols = query.symbols.split(',').map(s => s.trim().toLowerCase());
      return await this.priceService.getPrices(symbols);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch cryptocurrency prices',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Retrieves historical price data for a cryptocurrency over a specified time range.
   * @param symbol - The cryptocurrency symbol
   * @param range - Time range for historical data (1d, 7d, 30d, 90d, 1y)
   * @param interval - Data point interval (1h, 4h, 1d)
   */
  @Get(':symbol/history')
  @ApiOperation({ summary: 'Get historical price data for a cryptocurrency' })
  @ApiParam({ name: 'symbol', description: 'Cryptocurrency symbol (e.g., bitcoin)' })
  @ApiQuery({ name: 'range', enum: ['1d', '7d', '30d', '90d', '1y'] })
  @ApiQuery({ name: 'interval', enum: ['1h', '4h', '1d'] })
  async getHistoricalPrices(
    @Param('symbol') symbol: string,
    @Query('range') range: string,
    @Query('interval') interval: string
  ) {
    return this.priceService.getHistoricalPrices(symbol, range, interval);
  }

  /**
   * Retrieves price alerts for a specific price threshold
   * @param symbol - The cryptocurrency symbol
   * @param threshold - Price threshold for the alert
   * @param direction - Alert direction (above/below)
   */
  @Post(':symbol/alerts')
  @ApiOperation({ summary: 'Create a price alert' })
  async createPriceAlert(
    @Param('symbol') symbol: string,
    @Body() alertData: {
      threshold: number;
      direction: 'above' | 'below';
    }
  ) {
    return this.priceService.createPriceAlert(symbol, alertData);
  }

  /**
   * Retrieves market stats for a cryptocurrency including:
   * - Market cap
   * - 24h volume
   * - Circulating supply
   * - All-time high/low
   */
  @Get(':symbol/stats')
  @ApiOperation({ summary: 'Get detailed market statistics' })
  @ApiParam({ name: 'symbol', description: 'Cryptocurrency symbol (e.g., bitcoin)' })
  async getMarketStats(@Param('symbol') symbol: string) {
    return this.priceService.getMarketStats(symbol);
  }

  /**
   * Retrieves price comparison data between multiple cryptocurrencies
   * over a specified time period
   */
  @Get('compare')
  @ApiOperation({ summary: 'Compare price performance of multiple cryptocurrencies' })
  @ApiQuery({ 
    name: 'symbols', 
    description: 'Comma-separated list of cryptocurrency symbols',
    example: 'bitcoin,ethereum'
  })
  @ApiQuery({ name: 'timeframe', enum: ['24h', '7d', '30d', '90d', '1y'] })
  async comparePrices(
    @Query('symbols') symbols: string,
    @Query('timeframe') timeframe: string
  ) {
    const symbolArray = symbols.split(',').map(s => s.trim().toLowerCase());
    return this.priceService.comparePrices(symbolArray, timeframe);
  }

  /**
   * Retrieves price movement indicators including:
   * - RSI
   * - Moving averages
   * - Trading volume
   * - Price momentum
   */
  @Get(':symbol/indicators')
  @ApiOperation({ summary: 'Get technical price indicators' })
  @ApiParam({ name: 'symbol', description: 'Cryptocurrency symbol (e.g., bitcoin)' })
  async getPriceIndicators(
    @Param('symbol') symbol: string,
    @Query('indicators') indicators: string
  ) {
    const indicatorArray = indicators.split(',').map(i => i.trim().toLowerCase());
    return this.priceService.getPriceIndicators(symbol, indicatorArray);
  }
}
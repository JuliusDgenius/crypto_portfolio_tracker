import {
  Controller,
  Get, Query,
  ValidationPipe,
  HttpException,
  HttpStatus,
  Param, Body,
  Post,
  UseGuards
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiSecurity
} from '@nestjs/swagger';
import { PriceService } from '../services';
import { IAssetInfo, ICryptoPrice } from '../interfaces';
import { GetPricesDto, GetAssetInfoDto } from '../dto';
import { JwtAuthGuard, RateLimit } from '../../../common/src';
import { RateLimitGuard } from '../../../database/src'

/**
 * Controller for handling cryptocurrency price requests.
 */
@UseGuards(JwtAuthGuard, RateLimitGuard)
@RateLimit({ key: 'prices-controller', rule: { points: 30, duration: 60 } })
@ApiSecurity('JWT-auth')
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

  @RateLimit({ key: 'get-prices', rule: { points: 5, duration: 60 } })
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
   * Retrieves asset information for a cryptocurrency.
   * @param symbol - The cryptocurrency symbol
   */
  @RateLimit({ key: 'get-asset-info', rule: { points: 5, duration: 60 } })
  @Get('asset/info')
  @ApiOperation({ summary: 'Get asset information for a crypto asset' })
  @ApiQuery({ 
  name: 'symbol', 
  description: 'cryptocurrency symbol',
  example: 'bitcoin'
  })
  
  @ApiResponse({ 
    status: 200, description: 'Asset information retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  async getAssetInfo(
    @Query(new ValidationPipe({ transform: true })) query: GetAssetInfoDto
  ): Promise<IAssetInfo> {
    console.log("Hit with: ", query.symbol);
    return await this.priceService.getAssetInfo(query.symbol);
  }

  /**
   * Retrieves historical price data for a cryptocurrency over a specified time range.
   * @param symbol - The cryptocurrency symbol
   * @param range - Time range for historical data (1d, 7d, 30d, 90d, 1y)
   * @param interval - Data point interval (1h, 4h, 1d)
   */
  @RateLimit({ key: 'get-price-history', rule: { points: 5, duration: 60 } })
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
   * Retrieves market stats for a cryptocurrency including:
   * - Market cap
   * - 24h volume
   * - Circulating supply
   * - All-time high/low
   */
  @RateLimit({ key: 'get-stats', rule: { points: 5, duration: 60 } })
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
  @RateLimit({ key: 'compare', rule: { points: 5, duration: 60 } })
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
  @RateLimit({ key: 'get-price-indicator', rule: { points: 5, duration: 60 } })
  @Get(':symbol/indicators')
  @ApiOperation({ summary: 'Get technical price indicators' })
  @ApiParam({ name: 'symbol', description: 'Cryptocurrency symbol (e.g., bitcoin)' })
  async getPriceIndicators(
    @Param('symbol') symbol: string,
    @Query('indicators') indicators: string
  ) {
    const indicatorArray = indicators.split(
      ',').map(i => i.trim().toLowerCase()
    );
    return this.priceService.getPriceIndicators(symbol, indicatorArray);
  }

  @RateLimit({ key: 'get-available-cryptos', rule: { points: 5, duration: 60 } })
  @Get('available')
  @ApiOperation({ 
    summary: 'Get list of available cryptocurrencies',
    description: 'Returns a list of available cryptocurrencies \
      with their basic information including symbol, name, and current price'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of available cryptocurrencies retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          symbol: { type: 'string', example: 'BTC' },
          name: { type: 'string', example: 'Bitcoin' },
          currentPrice: { type: 'number', example: 42000.50 }
        }
      }
    }
  })
  async getAvailableCryptos() {
    return this.priceService.getAvailableCryptos();
  }
}
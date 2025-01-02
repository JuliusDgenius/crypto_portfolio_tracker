import {
  Controller,
  Logger, Get,
  Param, UseGuards,
  HttpException,
  HttpStatus, Query } from '@nestjs/common';
import {
  ApiTags, ApiOperation,
  ApiResponse, ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiBearerAuth,
  ApiSecurity
} from '@nestjs/swagger';
import { MarketService } from '../services/market.service';
import {
  IMarketData,
  IMarketSearchResult,
  IMarketTrendingResult,
  MarketDataResponse, 
  MarketSearchResponse, 
  MarketTrendingResponse
} from '../interfaces';
import { JwtAuthGuard } from '../../../common/src';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiSecurity('JWT-auth')
@ApiTags('Market Data')
@Controller('market')
export class MarketController {
  private readonly logger = new Logger(MarketController.name);

  constructor(
    private readonly marketService: MarketService,
  ) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search cryptocurrencies',
    description: 'Search for cryptocurrencies by name or symbol.\
    Returns matching results with price and market data.'
  })
  @ApiQuery({ 
    name: 'query', 
    required: true, 
    description: 'Search query string',
    example: 'bitcoin'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of results',
    default: 10
  })
  @ApiOkResponse({
    description: 'Search completed successfully',
    type: MarketSearchResponse,
    content: {
      'application/json': {
        example: {
          results: [
            {
              symbol: 'BTC',
              name: 'Bitcoin',
              price: 42000.50,
              marketCap: 850000000000
            },
            {
              symbol: 'BCH',
              name: 'Bitcoin Cash',
              price: 225.75,
              marketCap: 4400000000
            }
          ]
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid search parameters',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message: 'Search query is required'
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error occurred while processing request',
    content: {
      'application/json': {
        example: {
          statusCode: 500,
          message: 'Failed to search market data'
        }
      }
    }
  })
  async searchMarket(
    @Query('query') query: string,
    @Query('limit') limit?: number,
  ): Promise<{ results: IMarketSearchResult[] }> {
    if (!query || query.trim().length === 0) {
      this.logger.warn(`Invalid search attempt with empty setring`);
      throw new HttpException('Search query is required', HttpStatus.BAD_REQUEST);
    }

    try {
      this.logger.debug(`Searching market with query: "${query}", limit: ${limit}`);
      const results = await this.marketService.searchMarket(
        query,
        limit ? Math.min(Math.max(1, parseInt(limit.toString())), 100) : 10,
      );
      this.logger.debug(`Found ${results.length} results for query: "${query}"`);
      return { results };
    } catch (error) {
      this.logger.error(
        `Search market error for query: "${query}", limit: ${limit}`,
        error.stack
      );
      throw new HttpException(
        'Failed to search market data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending cryptocurrencies' })
  @ApiOkResponse({
    description: 'Trending data retrieved successfully',
    type: MarketTrendingResponse,
    content: {
      'application/json': {
        example: {
          trending: [
            {
              symbol: 'BTC',
              name: 'Bitcoin',
              price: 42000.50,
              change24h: 2.5
            },
            {
              symbol: 'ETH',
              name: 'Ethereum',
              price: 2250.75,
              change24h: 3.2
            }
          ]
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error occurred while processing request',
    content: {
      'application/json': {
        example: {
          statusCode: 500,
          message: 'Failed to fetch trending data'
        }
      }
    }
  })
  async getTrending(): Promise<{ trending: IMarketTrendingResult[] }> {
    try {
      this.logger.debug('Fetching trending cryptocurrencies');
      const trending = await this.marketService.getTrending();
      this.logger.debug(`Successfully fetched ${trending.length} trending cryptocurrencies`);
      return { trending };
    } catch (error) {
      this.logger.error('Failed to fetch trending data', error.stack);
      throw new HttpException(
        'Failed to fetch trending data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':symbol')
  @ApiOperation({
    summary: 'Get market data for a specific cryptocurrency',
    description: 'Retrieve detailed market data for a specific cryptocurrency using its symbol.'
  })
  @ApiParam({ 
    name: 'symbol', 
    description: 'Cryptocurrency symbol (e.g., bitcoin, ethereum)',
    example: 'bitcoin'
  })
  @ApiOkResponse({
    description: 'Market data retrieved successfully',
    type: MarketDataResponse,
    content: {
      'application/json': {
        example: {
          symbol: 'btc',
          name: 'Bitcoin',
          marketCap: 850000000000,
          volume24h: 28000000000,
          circulatingSupply: 19000000,
          totalSupply: 21000000,
          rank: 1,
          lastUpdated: '2024-12-28T16:06:26.415Z'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Cryptocurrency not found',
    content: {
      'application/json': {
        example: {
          statusCode: 404,
          message: 'Cryptocurrency not found'
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error occurred while processing request',
    content: {
      'application/json': {
        example: {
          statusCode: 500,
          message: 'Failed to fetch market data'
        }
      }
    }
  })
  async getMarketData(@Param('symbol') symbol: string): Promise<IMarketData> {
    try {
      return await this.marketService.getMarketData(symbol.toLowerCase());
    } catch (error) {
      this.logger.error(
        `Failed to fetch market data for ${symbol}`,
        error.stack
      )

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
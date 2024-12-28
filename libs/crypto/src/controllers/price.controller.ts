import {
  Controller,
  Get, Query,
  ValidationPipe,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery
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
}
// controllers/price.controller.ts
import { Controller, Get, Query, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PriceService } from '../services/price.service';
import { ICryptoPrice } from '../interfaces';
import { GetPricesDto } from '../dto/get-prices.dto';

@ApiTags('Cryptocurrency Prices')
@Controller('prices')
export class PriceController {
  constructor(private readonly priceService: PriceService) {}

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
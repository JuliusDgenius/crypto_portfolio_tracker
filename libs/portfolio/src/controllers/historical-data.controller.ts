import { Controller, Get, Post, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/src';
import { HistoricalDataService } from '../services';

@ApiTags('Historical Data')
@Controller('portfolios/:portfolioId/history')
@UseGuards(JwtAuthGuard)
export class HistoricalDataController {
  constructor(private readonly historicalDataService: HistoricalDataService) {}

  @Get()
  @ApiOperation({ summary: 'Get portfolio historical data' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns historical data points for the specified portfolio' 
  })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ 
    name: 'interval', 
    required: false, 
    enum: ['daily', 'weekly', 'monthly'],
    description: 'Data aggregation interval'
  })
  async getPortfolioHistory(
    @Param('portfolioId') portfolioId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('interval') interval?: 'daily' | 'weekly' | 'monthly'
  ) {
    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate 
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    return this.historicalDataService.getPortfolioHistory(
      portfolioId,
      start,
      end,
      interval || 'daily'
    );
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get portfolio performance metrics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns performance metrics for the specified portfolio' 
  })
  async getPerformanceMetrics(
    @Param('portfolioId') portfolioId: string
  ) {
    return this.historicalDataService.calculatePerformanceMetrics(portfolioId);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Manually refresh historical data' })
  @ApiResponse({ 
    status: 200, 
    description: 'Creates a new historical data point for the portfolio' 
  })
  async refreshHistoricalData(
    @Param('portfolioId') portfolioId: string
  ) {
    return this.historicalDataService.updatePortfolioHistory(portfolioId);
  }
}
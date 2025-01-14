import { Controller, Get, Post, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/src';
import { HistoricalDataService, AnalyticsService } from '../services';
import { GetPortfolioHistoryDto } from '../dto';

@ApiTags('Historical Data')
@Controller('portfolios/:portfolioId/')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class HistoricalDataController {
  constructor(
    private readonly historicalDataService: HistoricalDataService,
    private readonly analyticsService: AnalyticsService
  ) {}

  @Get('profitLoss')
  @ApiOperation({ summary: 'Get portfolio profit and Loss data' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns profitLoss data points for the specified portfolio' 
  })
  async getProfitLoss(@Param('portfolioId') portfolioId: string) {
    return this.analyticsService.calculateProfitLoss(portfolioId)
  }

  @Get('history')
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
    @Query() query: GetPortfolioHistoryDto  ,
  ) {
    // Default to last 30 days if no dates provided
    const end = query.endDate || new Date();
    const start = query.startDate || new Date(query.endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    return this.historicalDataService.getPortfolioHistory(
      portfolioId,
      start,
      end,
      query.interval || 'daily'
    );
  }

  @Get('historicalValue')
  @ApiOperation({ summary: 'Get a single historical value for a portfolio on a specific date' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the historical value for the specified portfolio and date' 
  })
  @ApiQuery({ name: 'date', required: true, type: Date })
  async getHistoricalValue(
    @Param('portfolioId') portfolioId: string,
    @Query('date') date: string,
  ) {
    return this.historicalDataService.getHistoricalValue(portfolioId, new Date(date));
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
    return this.analyticsService.calculatePerformanceMetrics(portfolioId);
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
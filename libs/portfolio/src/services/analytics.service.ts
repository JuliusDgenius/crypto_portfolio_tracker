import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/src';
import { HistoricalDataService } from './historial.service'; 
@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private readonly historicalDataService: HistoricalDataService,
  ) {}

  async calculateProfitLoss(portfolioId: string) {
    const [dayAgo, weekAgo, monthAgo, yearAgo] = this.getHistoricalDates();

    const currentValue = await this.getCurrentPortfolioValue(portfolioId);
    const initialValue = await this.getInitialPortfolioValue(portfolioId);

    const [dayData, weekData, monthData, yearData] = await Promise.all([
      this.historicalDataService.getHistoricalValue(portfolioId, dayAgo),
      this.historicalDataService.getHistoricalValue(portfolioId, weekAgo),
      this.historicalDataService.getHistoricalValue(portfolioId, monthAgo),
      this.historicalDataService.getHistoricalValue(portfolioId, yearAgo),
    ]);

    return {
      day: this.calculatePercentageChange(dayData?.totalValue, currentValue),
      week: this.calculatePercentageChange(weekData?.totalValue, currentValue),
      month: this.calculatePercentageChange(monthData?.totalValue, currentValue),
      year: this.calculatePercentageChange(yearData?.totalValue, currentValue),
      allTime: this.calculatePercentageChange(initialValue, currentValue),
    };
  }

    /**
   * Calculates performance metrics for a portfolio
   */
    async calculatePerformanceMetrics(portfolioId: string) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
      const historicalData = await this.historicalDataService.getPortfolioHistory(
        portfolioId,
        thirtyDaysAgo,
        new Date(),
        'daily'
      );
  
      if (historicalData.length < 2) {
        return {
          change: 0,
          percentageChange: 0,
        };
      }
  
      const firstValue = historicalData[0].totalValue;
      const lastValue = historicalData[historicalData.length - 1].totalValue;
  
      return {
        change: lastValue - firstValue,
        percentageChange: ((lastValue - firstValue) / firstValue) * 100,
      };
    }

  private getHistoricalDates() {
    const now = new Date();
    return [
      new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
      new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
      new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
    ];
  }

  private async getCurrentPortfolioValue(portfolioId: string): Promise<number> {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: { totalValue: true },
    });
    return portfolio.totalValue;
  }

  private async getInitialPortfolioValue(portfolioId: string): Promise<number> {
    const firstTransaction = await this.prisma.transaction.findFirst({
      where: { portfolioId },
      orderBy: { date: 'asc' },
    });
    return firstTransaction ? firstTransaction.amount * firstTransaction.pricePerUnit : 0;
  }

  private calculatePercentageChange(
    initialValue: number | undefined,
    currentValue: number,
  ): number {
    if (!initialValue) return 0;
    return ((currentValue - initialValue) / initialValue) * 100;
  }

  async getPortfolioPerformance(portfolioId: string, timeFrame: string) {
    const endDate = new Date();
    let startDate = new Date();

    // Calculate start date based on timeframe
    switch (timeFrame) {
      case '1D':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '1W':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'YTD':
        startDate = new Date(startDate.getFullYear(), 0, 1);
        break;
      case '1Y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'All':
        // Get the first transaction date
        const firstTransaction = await this.prisma.transaction.findFirst({
          where: { portfolioId },
          orderBy: { date: 'asc' },
        });
        startDate = firstTransaction?.date || startDate;
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1); // Default to 1M
    }

    const historicalData = await this.historicalDataService.getPortfolioHistory(
      portfolioId,
      startDate,
      endDate,
      'daily'
    );

    return historicalData.map(data => ({
      date: data.date,
      value: data.totalValue,
      benchmark: data.benchmarkValue // If available
    }));
  }

  async getPortfolioHealth(portfolioId: string) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        assets: true,
        transactions: {
          orderBy: { date: 'desc' },
          take: 100
        }
      }
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    // Calculate diversification score
    const diversificationScore = this.calculateDiversificationScore(portfolio.assets);

    // Calculate volatility
    const volatility = await this.calculateVolatility(portfolioId);

    // Calculate risk-adjusted returns
    const { sharpeRatio, sortinoRatio } = await this.calculateRiskAdjustedReturns(portfolioId);

    // Calculate max drawdown
    const maxDrawdown = await this.calculateMaxDrawdown(portfolioId);

    // Calculate Value at Risk (VaR)
    const valueAtRisk = await this.calculateValueAtRisk(portfolioId);

    return {
      diversificationScore,
      volatility,
      riskAdjustedReturns: {
        sharpeRatio,
        sortinoRatio
      },
      maxDrawdown,
      valueAtRisk
    };
  }

  async getRiskAnalysis(portfolioId: string) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        assets: true
      }
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    // Calculate overall risk level
    const overallRisk = await this.calculateOverallRisk(portfolioId);

    // Calculate volatility
    const volatility = await this.calculateVolatility(portfolioId);

    // Calculate liquidity risk
    const liquidityRisk = await this.calculateLiquidityRisk(portfolio.assets);

    // Calculate concentration risk
    const concentrationRisk = this.calculateConcentrationRisk(portfolio.assets);

    // Calculate market risk
    const marketRisk = await this.calculateMarketRisk(portfolioId);

    // Run stress tests
    const stressTestResults = await this.runStressTests(portfolioId);

    return {
      overallRisk,
      volatility,
      liquidityRisk,
      concentrationRisk,
      marketRisk,
      stressTestResults
    };
  }

  async getCorrelationMatrix(portfolioId: string) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        assets: true
      }
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    const assets = portfolio.assets;
    const matrix: { [key: string]: { [key: string]: number } } = {};

    // Calculate correlation between each pair of assets
    for (const asset1 of assets) {
      matrix[asset1.symbol] = {};
      for (const asset2 of assets) {
        if (asset1.symbol === asset2.symbol) {
          matrix[asset1.symbol][asset2.symbol] = 1;
        } else {
          matrix[asset1.symbol][asset2.symbol] = await this.calculateCorrelation(
            asset1.symbol,
            asset2.symbol
          );
        }
      }
    }

    return matrix;
  }

  private calculateDiversificationScore(assets: any[]): number {
    // Implement Herfindahl-Hirschman Index (HHI) calculation
    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
    const weights = assets.map(asset => asset.value / totalValue);
    const hhi = weights.reduce((sum, weight) => sum + weight * weight, 0);
    
    // Convert HHI to a 0-100 score (inverse relationship)
    return Math.max(0, 100 - (hhi * 100));
  }

  private async calculateVolatility(portfolioId: string): Promise<number> {
    const historicalData = await this.historicalDataService.getPortfolioHistory(
      portfolioId,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      new Date(),
      'daily'
    );

    if (historicalData.length < 2) return 0;

    const returns = historicalData.slice(1).map((data, i) => {
      const prevValue = historicalData[i].totalValue;
      return (data.totalValue - prevValue) / prevValue;
    });

    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
  }

  private async calculateRiskAdjustedReturns(portfolioId: string) {
    const historicalData = await this.historicalDataService.getPortfolioHistory(
      portfolioId,
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
      new Date(),
      'daily'
    );

    if (historicalData.length < 2) {
      return { sharpeRatio: 0, sortinoRatio: 0 };
    }

    const returns = historicalData.slice(1).map((data, i) => {
      const prevValue = historicalData[i].totalValue;
      return (data.totalValue - prevValue) / prevValue;
    });

    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // Sharpe Ratio (assuming risk-free rate of 0.02)
    const sharpeRatio = (mean - 0.02) / stdDev;

    // Sortino Ratio (only considering negative returns)
    const negativeReturns = returns.filter(ret => ret < 0);
    const downsideDeviation = Math.sqrt(
      negativeReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / negativeReturns.length
    );
    const sortinoRatio = (mean - 0.02) / downsideDeviation;

    return { sharpeRatio, sortinoRatio };
  }

  private async calculateMaxDrawdown(portfolioId: string): Promise<number> {
    const historicalData = await this.historicalDataService.getPortfolioHistory(
      portfolioId,
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
      new Date(),
      'daily'
    );

    if (historicalData.length < 2) return 0;

    let maxDrawdown = 0;
    let peak = historicalData[0].totalValue;

    for (const data of historicalData) {
      if (data.totalValue > peak) {
        peak = data.totalValue;
      }
      const drawdown = (peak - data.totalValue) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown * 100; // Convert to percentage
  }

  private async calculateValueAtRisk(portfolioId: string): Promise<number> {
    const historicalData = await this.historicalDataService.getPortfolioHistory(
      portfolioId,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      new Date(),
      'daily'
    );

    if (historicalData.length < 2) return 0;

    const returns = historicalData.slice(1).map((data, i) => {
      const prevValue = historicalData[i].totalValue;
      return (data.totalValue - prevValue) / prevValue;
    });

    // Sort returns in ascending order
    returns.sort((a, b) => a - b);

    // Calculate 95% VaR (5th percentile)
    const index = Math.floor(returns.length * 0.05);
    const var95 = -returns[index] * 100; // Convert to percentage

    return var95;
  }

  private async calculateOverallRisk(portfolioId: string): Promise<string> {
    const volatility = await this.calculateVolatility(portfolioId);
    const maxDrawdown = await this.calculateMaxDrawdown(portfolioId);
    const valueAtRisk = await this.calculateValueAtRisk(portfolioId);

    // Combine metrics to determine overall risk level
    const riskScore = (volatility * 0.4 + maxDrawdown * 0.3 + valueAtRisk * 0.3) / 100;

    if (riskScore < 0.2) return 'LOW';
    if (riskScore < 0.4) return 'MODERATE';
    if (riskScore < 0.6) return 'MODERATE_HIGH';
    if (riskScore < 0.8) return 'HIGH';
    return 'VERY_HIGH';
  }

  private async calculateLiquidityRisk(assets: any[]): Promise<string> {
    // Implement liquidity risk calculation based on:
    // - Trading volume
    // - Market cap
    // - Bid-ask spread
    // This is a simplified version
    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
    const illiquidAssets = assets.filter(asset => asset.value / totalValue > 0.1);
    
    if (illiquidAssets.length === 0) return 'LOW';
    if (illiquidAssets.length === 1) return 'MODERATE';
    if (illiquidAssets.length === 2) return 'MODERATE_HIGH';
    return 'HIGH';
  }

  private calculateConcentrationRisk(assets: any[]): string {
    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
    const maxAllocation = Math.max(...assets.map(asset => asset.value / totalValue));
    
    if (maxAllocation < 0.2) return 'LOW';
    if (maxAllocation < 0.4) return 'MODERATE';
    if (maxAllocation < 0.6) return 'MODERATE_HIGH';
    return 'HIGH';
  }

  private async calculateMarketRisk(portfolioId: string): Promise<string> {
    // Implement market risk calculation based on:
    // - Beta to major cryptocurrencies
    // - Market correlation
    // This is a simplified version
    const historicalData = await this.historicalDataService.getPortfolioHistory(
      portfolioId,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date(),
      'daily'
    );

    if (historicalData.length < 2) return 'MODERATE';

    const volatility = await this.calculateVolatility(portfolioId);
    
    if (volatility < 0.2) return 'LOW';
    if (volatility < 0.4) return 'MODERATE';
    if (volatility < 0.6) return 'MODERATE_HIGH';
    return 'HIGH';
  }

  private async runStressTests(portfolioId: string) {
    const scenarios = [
      {
        name: 'Market Crash',
        description: 'Simulates a 30% market crash',
        impact: -30
      },
      {
        name: 'Volatility Spike',
        description: 'Simulates increased market volatility',
        impact: -15
      },
      {
        name: 'Liquidity Crisis',
        description: 'Simulates a liquidity crisis in crypto markets',
        impact: -20
      },
      {
        name: 'Regulatory Impact',
        description: 'Simulates negative regulatory news',
        impact: -25
      }
    ];

    const currentValue = await this.getCurrentPortfolioValue(portfolioId);
    
    return scenarios.map(scenario => ({
      scenario: scenario.name,
      description: scenario.description,
      impact: scenario.impact,
      estimatedValue: currentValue * (1 + scenario.impact / 100)
    }));
  }

  private async calculateCorrelation(symbol1: string, symbol2: string): Promise<number> {
    // Get historical price data for both assets
    const historicalData1 = await this.historicalDataService.getAssetHistory(symbol1);
    const historicalData2 = await this.historicalDataService.getAssetHistory(symbol2);

    if (historicalData1.length < 2 || historicalData2.length < 2) return 0;

    // Calculate returns
    const returns1 = historicalData1.slice(1).map((data, i) => {
      const prevPrice = historicalData1[i].price;
      return (data.price - prevPrice) / prevPrice;
    });

    const returns2 = historicalData2.slice(1).map((data, i) => {
      const prevPrice = historicalData2[i].price;
      return (data.price - prevPrice) / prevPrice;
    });

    // Calculate correlation coefficient
    const mean1 = returns1.reduce((sum, ret) => sum + ret, 0) / returns1.length;
    const mean2 = returns2.reduce((sum, ret) => sum + ret, 0) / returns2.length;

    const covariance = returns1.reduce((sum, ret1, i) => {
      const ret2 = returns2[i];
      return sum + (ret1 - mean1) * (ret2 - mean2);
    }, 0) / returns1.length;

    const stdDev1 = Math.sqrt(
      returns1.reduce((sum, ret) => sum + Math.pow(ret - mean1, 2), 0) / returns1.length
    );
    const stdDev2 = Math.sqrt(
      returns2.reduce((sum, ret) => sum + Math.pow(ret - mean2, 2), 0) / returns2.length
    );

    return covariance / (stdDev1 * stdDev2);
  }
}
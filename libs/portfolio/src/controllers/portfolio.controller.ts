import { 
  Controller, 
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import { CurrentUser, JwtAuthGuard } from '../../../auth/src';
import { PortfolioService } from '../services/portfolio.service';
import { AnalyticsService } from '../services/analytics.service';
import { AddAssetDto, CreatePortfolioDto, UpdatePortfolioDto } from '../dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiSecurity,    // Added for documenting security requirements
  ApiHeader,      // Added for documenting JWT header
} from '@nestjs/swagger';

@ApiTags('portfolios')
@ApiBearerAuth('JWT-auth')
@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new portfolio',
    description: `
      Creates a new investment portfolio for the authenticated user. 
      The portfolio is automatically associated with the user based on their JWT token.
      Initial portfolio is created with:
      - Zero total value
      - Empty asset list
      - Default profit/loss metrics set to 0
      - Current timestamp as lastUpdated
    `
  })
  @ApiSecurity('JWT-auth')
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT Bearer token',
    required: true,
    schema: {
      type: 'string',
      example: 'Bearer eyJhbGciOiJIUzI1NiIs...',
    }
  })
  @ApiBody({
    type: CreatePortfolioDto,
    description: 'Portfolio creation parameters',
    examples: {
      minimal: {
        summary: 'Minimal Portfolio',
        description: 'Creates a portfolio with only required fields',
        value: {
          name: 'My Portfolio'
        }
      },
      complete: {
        summary: 'Complete Portfolio',
        description: 'Creates a portfolio with all available fields',
        value: {
          name: 'My Crypto Portfolio',
          description: 'A portfolio for tracking my cryptocurrency investments'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Portfolio successfully created',
    schema: {
      type: 'object',
      properties: {
        portfolio: {
          type: 'object',
          properties: {
            id: { 
              type: 'string', 
              format: 'uuid',
              description: 'Unique identifier for the portfolio'
            },
            name: { 
              type: 'string',
              description: 'Name of the portfolio'
            },
            description: { 
              type: 'string',
              description: 'Detailed description of the portfolio',
              nullable: true
            },
            totalValue: { 
              type: 'number',
              description: 'Total current value of all assets',
              default: 0
            },
            profitLoss: {
              type: 'object',
              properties: {
                day: { type: 'number', default: 0 },
                week: { type: 'number', default: 0 },
                month: { type: 'number', default: 0 },
                year: { type: 'number', default: 0 },
                allTime: { type: 'number', default: 0 }
              }
            },
            lastUpdated: { 
              type: 'string', 
              format: 'date-time'
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the user who owns this portfolio'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication failed - invalid or missing JWT token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'Invalid or missing JWT token' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input - name is required and must be a string'
  })
  async createPortfolio(
    @Body() createPortfolioDto: CreatePortfolioDto,
    @CurrentUser('id') userId: string, // userId is extracted from JWT token
  ) {
    const portfolio = await this.portfolioService.createPortfolio(
      userId,
      createPortfolioDto,
    );
    
    return { portfolio };
  }

  @Post(':portfolioId/assets')
@HttpCode(HttpStatus.CREATED)
@ApiOperation({ 
  summary: 'Add a new asset to portfolio',
  description: `
    Adds a new cryptocurrency asset to track in the specified portfolio.
    The asset is initialized with default values:
    - Zero quantity
    - Zero current price
    - Zero average buy price
    - Zero value
    - Zero allocation
    These values will be updated when transactions are recorded.
    An asset must be added to a portfolio before transactions can be recorded for it.
  `
})
@ApiSecurity('JWT-auth')
@ApiParam({
  name: 'portfolioId',
  description: 'ID of the portfolio to add the asset to',
  type: 'string',
  format: 'ObjectId'
})
@ApiBody({
  type: AddAssetDto,
  description: 'Asset creation parameters',
  examples: {
    minimal: {
      summary: 'Basic Asset',
      description: 'Creates an asset with required fields',
      value: {
        symbol: 'BTC',
        name: 'Bitcoin'
      }
    },
    complete: {
      summary: 'Complete Asset',
      description: 'Creates an asset with all available fields',
      value: {
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 0,
        averageBuyPrice: 0,
        currentPrice: 0,
        value: 0,
        allocation: 0
      }
    }
  }
})
@ApiResponse({
  status: HttpStatus.CREATED,
  description: 'Asset successfully added to portfolio',
  schema: {
    type: 'object',
    properties: {
      asset: {
        type: 'object',
        properties: {
          id: { 
            type: 'string', 
            format: 'ObjectId',
            description: 'Unique identifier for the asset'
          },
          symbol: { 
            type: 'string',
            description: 'Cryptocurrency symbol (e.g., BTC)'
          },
          name: { 
            type: 'string',
            description: 'Full name of the cryptocurrency'
          },
          quantity: { 
            type: 'number',
            description: 'Current quantity held',
            default: 0
          },
          averageBuyPrice: {
            type: 'number',
            description: 'Average purchase price per unit',
            default: 0
          },
          currentPrice: {
            type: 'number',
            description: 'Current market price per unit',
            default: 0
          },
          value: {
            type: 'number',
            description: 'Total value of holdings (quantity * currentPrice)',
            default: 0
          },
          allocation: {
            type: 'number',
            description: 'Percentage allocation in portfolio',
            default: 0
          },
          portfolioId: {
            type: 'string',
            format: 'ObjectId',
            description: 'ID of the portfolio this asset belongs to'
          },
          lastUpdated: {
            type: 'string',
            format: 'date-time'
          }
        }
      }
    }
  }
})
@ApiResponse({
  status: HttpStatus.CONFLICT,
  description: 'Asset already exists in portfolio',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 409 },
      message: { type: 'string', example: 'Asset already exists in portfolio' },
      error: { type: 'string', example: 'Conflict' }
    }
  }
})
@ApiResponse({
  status: HttpStatus.NOT_FOUND,
  description: 'Portfolio not found',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 404 },
      message: { type: 'string', example: 'Portfolio not found' },
      error: { type: 'string', example: 'Not Found' }
    }
  }
})
async addAssetToPortfolio(
  @CurrentUser('id') userId: string,
  @Param('portfolioId') portfolioId: string,
  @Body() addAssetDto: AddAssetDto
) {
  const asset = await this.portfolioService.addAssetToPortfolio(
    userId,
    portfolioId,
    addAssetDto
  );
  return { asset };
}

  @Get('portfolios')
  @ApiOperation({
    summary: 'Get all portfolios for user',
    description: 'Retrieves all portfolios belonging to the authenticated user, including their assets'
  })
  @ApiSecurity('JWT-auth')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of user portfolios retrieved successfully'
  })
  async getPortfolios(@CurrentUser('id') userId: string) {
    const portfolios = await this.portfolioService.getPortfolios(userId);
    return { portfolios };
  }

  @Get(':portfolioId')
  @ApiOperation({
    summary: 'Get portfolio by ID',
    description: 'Retrieves a specific portfolio by its ID for the authenticated user'
  })
  @ApiParam({
    name: 'portfolioId',
    description: 'ID of the portfolio to retrieve',
    type: 'string'
  })
  @ApiSecurity('JWT-auth')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Portfolio retrieved successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Portfolio not found'
  })
  async getPortfolioById(
    @CurrentUser('id') userId: string,
    @Param('portfolioId') portfolioId: string
  ) {
    const portfolio = await this.portfolioService.getPortfoliosById(userId, portfolioId);
    return { portfolio };
  }

  @Get(':portfolioId/metrics')
  @ApiOperation({
    summary: 'Get portfolio metrics',
    description: 'Retrieves detailed metrics for a specific portfolio including profit/loss, asset allocation, and performance'
  })
  @ApiParam({
    name: 'portfolioId',
    description: 'ObjectId of the portfolio to get metrics for',
    type: 'string',
  })
  @ApiSecurity('JWT-auth')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Portfolio metrics retrieved successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Portfolio not found'
  })
  async getPortfolioMetrics(
    @Param('portfolioId') portfolioId: string
  ) {
    const metrics = await this.portfolioService.getPortfolioMetrics(portfolioId);
    return { metrics };
  }

  @Patch(':portfolioId')
  @ApiOperation({
    summary: 'Update portfolio',
    description: 'Updates the name and/or description of an existing portfolio'
  })
  @ApiParam({
    name: 'portfolioId',
    description: 'ObjectId of the portfolio to update',
    type: 'string',
  })
  @ApiBody({
    type: UpdatePortfolioDto,
    description: 'Portfolio update parameters',
    examples: {
      name: {
        summary: 'Update Name',
        value: {
          name: 'New Portfolio Name'
        }
      },
      description: {
        summary: 'Update Description',
        value: {
          description: 'Updated portfolio description'
        }
      },
      both: {
        summary: 'Update Both',
        value: {
          name: 'New Portfolio Name',
          description: 'Updated portfolio description'
        }
      }
    }
  })
  @ApiSecurity('JWT-auth')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Portfolio updated successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Portfolio not found'
  })
  async updatePortfolio(
    @CurrentUser('id') userId: string,
    @Param('portfolioId') portfolioId: string,
    @Body() updatePortfolioDto: UpdatePortfolioDto
  ) {
    const portfolio = await this.portfolioService.updatePortfolio(
      userId,
      portfolioId,
      updatePortfolioDto
    );
    return { portfolio };
  }

  @Delete(':portfolioId')
  @ApiOperation({
    summary: 'Delete portfolio',
    description: 'Deletes a portfolio and all associated assets and transactions'
  })
  @ApiParam({
    name: 'portfolioId',
    description: 'ObjectId of the portfolio to delete',
    type: 'string',
  })
  @ApiSecurity('JWT-auth')
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Portfolio deleted successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Portfolio not found'
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePortfolio(
    @CurrentUser('id') userId: string,
    @Param('portfolioId') portfolioId: string
  ) {
    await this.portfolioService.deletePortfolio(userId, portfolioId);
  }
}
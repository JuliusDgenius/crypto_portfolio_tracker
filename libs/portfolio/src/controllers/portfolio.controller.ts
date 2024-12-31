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
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CurrentUser, JwtAuthGuard } from '../../../auth/src';
import { PortfolioService } from '../services/portfolio.service';
import { AnalyticsService } from '../services/analytics.service';
import { CreatePortfolioDto, UpdatePortfolioDto } from '../dto';
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

  @Post()
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
  // @ApiHeader({
  //   name: 'Authorization',
  //   description: 'JWT Bearer token',
  //   required: true,
  //   schema: {
  //     type: 'string',
  //     example: 'Bearer eyJhbGciOiJIUzI1NiIs...',
  //   }
  // })
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
    @CurrentUser('sub') userId: string, // userId is extracted from JWT token
  ) {
    console.log("Controller hit with DTO:", createPortfolioDto);
    console.log("User ID from token:", userId);

    const portfolio = await this.portfolioService.createPortfolio(
      userId,
      createPortfolioDto,
    );
    
    return { portfolio };
  }
}
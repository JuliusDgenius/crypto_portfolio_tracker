import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/src';
import { CurrentUser } from '../../../auth/src';
import { TransactionService } from '../services/transaction.service';
import { CreateTransactionDto } from '../dto';
import { TransactionType } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';

@ApiTags('transactions')
@ApiBearerAuth()
@ApiSecurity('JWT-auth')
@Controller('portfolio/:portfolioId/transaction')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new transaction',
    description: 'Records a new transaction (buy/sell) for a specific portfolio. The portfolio must belong to the authenticated user.',
  })
  @ApiParam({
    name: 'portfolioId',
    description: 'ObjectId of the portfolio',
    type: 'string',
    required: true,
  })
  @ApiBody({
    description: 'Transaction details',
    type: CreateTransactionDto,
    examples: {
      buy: {
        summary: 'Buy Transaction',
        description: 'Example of buying cryptocurrency',
        value: {
          type: 'BUY',
          cryptocurrency: 'BTC',
          amount: 0.5,
          pricePerUnit: 50000,
          date: new Date().toISOString(),
        },
      },
      sell: {
        summary: 'Sell Transaction',
        description: 'Example of selling cryptocurrency',
        value: {
          type: 'SELL',
          cryptocurrency: 'ETH',
          amount: 2.0,
          pricePerUnit: 3000,
          date: new Date().toISOString(),
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Transaction successfully created',
    schema: {
      type: 'object',
      properties: {
        transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'ObjectId' },
            type: { type: 'string', enum: ['BUY', 'SELL'] },
            cryptocurrency: { type: 'string' },
            amount: { type: 'number' },
            pricePerUnit: { type: 'number' },
            date: { type: 'string', format: 'date-time' },
            portfolioId: { type: 'string', format: 'ObjectId' },
          },
        },
        portfolio: { type: 'string', format: 'ObjectId' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have access to this portfolio',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid transaction data provided',
  })
  async createTransaction(
    @Param('portfolioId') portfolioId: string,
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser('id') userId: string,
  ) {
    const transaction = await this.transactionService.createTransaction(
      userId,
      portfolioId,
      createTransactionDto,
    );
    
    return { 
      transaction,
      portfolio: transaction.portfolioId,
    };
  }

  @Get('transactions')
  @ApiOperation({
    summary: 'Get portfolio transactions',
    description: 'Retrieves a paginated list of transactions for a specific portfolio. Supports filtering by transaction type and cryptocurrency.',
  })
  @ApiParam({
    name: 'portfolioId',
    description: 'ObjectId of the portfolio',
    type: 'string',
    format: 'ObjectId',
    required: true,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    type: 'number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: 'number',
    example: 10,
  })
  @ApiQuery({
    name: 'type',
    description: 'Filter by transaction type',
    required: false,
    enum: TransactionType,
  })
  @ApiQuery({
    name: 'cryptocurrency',
    description: 'Filter by cryptocurrency symbol (e.g., BTC, ETH)',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'sort',
    description: 'Sort field and direction (format: field:direction)',
    required: false,
    type: 'string',
    example: 'date:desc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of transactions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              type: { type: 'string', enum: ['BUY', 'SELL'] },
              cryptocurrency: { type: 'string' },
              amount: { type: 'number' },
              pricePerUnit: { type: 'number' },
              timestamp: { type: 'string', format: 'date-time' },
              portfolioId: { type: 'string', format: 'uuid' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            currentPage: { type: 'number' },
            itemsPerPage: { type: 'number' },
            totalItems: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have access to this portfolio',
  })
  async getTransactions(
    @Param('portfolioId') portfolioId: string,
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('type') type?: TransactionType,
    @Query('cryptocurrency') cryptocurrency?: string,
    @Query('sort') sort?: string,
  ) {
    const transactions = await this.transactionService.getTransactions(
      portfolioId,
      userId,
      {
        page,
        limit,
        type,
        cryptocurrency,
        sort
      },
    );
    
    return transactions;
  }
}
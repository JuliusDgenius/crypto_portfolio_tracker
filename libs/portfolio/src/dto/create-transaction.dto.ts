import { IsString, IsNumber, IsOptional, IsEnum, IsDate, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';

// First, let's define the transaction type enum to match our model
export enum PortfolioTransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT'
}

export class CreateTransactionDto {
  @ApiProperty({
    enum: TransactionType,
    description: 'Type of transaction',
    example: TransactionType.BUY
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description: 'Cryptocurrency symbol or identifier',
    example: 'BTC'
  })
  @IsString()
  cryptocurrency: string;

  @ApiProperty({
    description: 'Amount of cryptocurrency involved in the transaction',
    example: 0.5,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Price per unit at the time of transaction',
    example: 45000
  })
  @IsNumber()
  @Min(0)
  pricePerUnit: number;

  @ApiPropertyOptional({
    description: 'Transaction fee (if any)',
    example: 2.5
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;

  @ApiPropertyOptional({
    description: 'Exchange where the transaction occurred',
    example: 'Binance'
  })
  @IsOptional()
  @IsString()
  exchange?: string;

  @ApiPropertyOptional({
    description: 'Wallet address involved in the transaction',
    example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
  })
  @IsOptional()
  @IsString()
  wallet?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the transaction',
    example: 'DCA purchase for September'
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Date of the transaction',
    example: '2024-01-01T12:00:00Z'
  })
  @Type(() => Date)
  @IsDate()
  date: Date;

  portfolioId: string;

  assetId: string
}
import { IsString, IsNumber, IsOptional, IsEnum, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Type of transaction',
    enum: TransactionType,
    example: TransactionType.BUY,
    required: true,
    enumName: 'TransactionType',
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description: 'Cryptocurrency symbol/ticker',
    example: 'BTC',
    required: true,
  })
  @IsString()
  cryptocurrency: string;

  @ApiProperty({
    description: 'Amount of cryptocurrency to buy/sell',
    example: 0.5,
    required: true,
    type: Number,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Price per unit in base currency',
    example: 50000,
    required: true,
    type: Number,
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Transaction fee in base currency',
    example: 2.99,
    required: false,
    type: Number,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  fee?: number;

  @ApiProperty({
    description: 'Exchange where the transaction occurred',
    example: 'Binance',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  exchange?: string;

  @ApiProperty({
    description: 'Wallet address or identifier',
    example: '0x1234...',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  wallet?: string;

  @ApiProperty({
    description: 'Additional notes about the transaction',
    example: 'Monthly DCA purchase',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Date and time of the transaction',
    example: new Date().toISOString(),
    required: true,
    type: Date,
  })
  @IsDate()
  date: Date;
}
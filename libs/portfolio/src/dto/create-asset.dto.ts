import { ApiProperty } from "@nestjs/swagger";
import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  Min, 
  IsPositive 
} from "class-validator";

export class AddAssetDto {
  @ApiProperty({
    description: 'Cryptocurrency symbol',
    example: 'BTC'
  })
  @IsString()
  symbol: string;

  @ApiProperty({
    description: 'Full name of the cryptocurrency',
    example: 'Bitcoin'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Amount of cryptocurrency',
    example: 0,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  quantity: number = 0;

  @ApiProperty({
    description: 'Average purchase price per unit',
    example: 0,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  averageBuyPrice: number = 0;

  @ApiProperty({
    description: 'Current market price per unit',
    example: 0,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  currentPrice: number = 0;

  @ApiProperty({
    description: 'Total value of the asset',
    example: 0,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  value: number = 0;

  @ApiProperty({
    description: 'Percentage allocation in portfolio',
    example: 0,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  allocation: number = 0;

  @ApiProperty({
    description: 'Category of the cryptocurrency (e.g., DeFi, Layer 1, Layer 2)',
    example: 'Layer 1',
    required: false
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Market capitalization of the cryptocurrency',
    example: '$1.2T',
    required: false
  })
  @IsString()
  @IsOptional()
  marketCap?: string;

  @ApiProperty({
    description: '24-hour price change percentage',
    example: 0,
    required: false
  })
  @IsNumber()
  @IsOptional()
  twentyFourHourChange?: number = 0;

  @ApiProperty({
    description: 'Total profit/loss percentage',
    example: 0,
    required: false
  })
  @IsNumber()
  @IsOptional()
  profitLossPercentage?: number = 0;
}
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
}
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Min } from "class-validator";

import { IsNumber } from "class-validator";

export class UpdateAssetDto {
    @ApiPropertyOptional({
      description: 'Updated amount of cryptocurrency',
      minimum: 0
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    amount?: number;

    @ApiProperty({
        description: 'Average purchase price per unit',
        example: 45000,
        minimum: 0
      })
      @IsNumber()
      @Min(0)
    value: number

    @ApiProperty({
        description: 'Current market price per unit',
        example: 47000,
        minimum: 0
      })
      @IsNumber()
      @Min(0)
      allocation: number;
  
    @ApiPropertyOptional({
      description: 'Updated current market price',
      minimum: 0
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    currentPrice?: number;
  
    @ApiPropertyOptional({
      description: 'Updated average buy price',
      minimum: 0
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    averageBuyPrice?: number;

    @ApiProperty({
        description: 'Full name of the cryptocurrency',
        example: 'Bitcoin'
      })
      @IsString()
      name: string;
    
      @ApiProperty({
        description: 'Amount of cryptocurrency',
        example: 1.5,
        minimum: 0
      })
      @IsNumber()
      @Min(0)
      quantity: number;
  }
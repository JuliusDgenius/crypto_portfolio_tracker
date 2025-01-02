import { IsEnum, IsNumber, IsString, Min } from "class-validator";

import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsOptional } from "class-validator";
import { TransactionType } from "@prisma/client";

export class UpdateTransactionDto {
    @ApiPropertyOptional({
      enum: TransactionType,
      description: 'Updated type of transaction'
    })
    @IsOptional()
    @IsEnum(TransactionType)
    type?: TransactionType;
  
    @ApiPropertyOptional({
      description: 'Updated amount of cryptocurrency',
      minimum: 0
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    amount?: number;
  
    @ApiPropertyOptional({
      description: 'Updated price per unit'
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;
  
    @ApiPropertyOptional({
      description: 'Updated transaction fee'
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    fee?: number;
  
    @ApiPropertyOptional({
      description: 'Updated exchange information'
    })
    @IsOptional()
    @IsString()
    exchange?: string;
  
    @ApiPropertyOptional({
      description: 'Updated wallet address'
    })
    @IsOptional()
    @IsString()
    wallet?: string;
  
    @ApiPropertyOptional({
      description: 'Updated transaction notes'
    })
    @IsOptional()
    @IsString()
    notes?: string;
  
    @ApiPropertyOptional({
      description: 'Updated transaction date'
    })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    date?: Date;
  }
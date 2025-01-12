// src/alerts/dto/get-price-alerts.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { AlertStatus } from '../types/alert.type';

/**
 * DTO for filtering price alerts when retrieving them
 * Provides optional parameters to customize the query
 */
export class GetPriceAlertsDto {
  @ApiPropertyOptional({
    description: 'Filter alerts by their current status',
    enum: AlertStatus,
    example: AlertStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @ApiPropertyOptional({
    description: 'Get alerts created after this date',
    example: '2024-01-01T00:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  from?: Date;

  @ApiPropertyOptional({
    description: 'Get alerts created before this date',
    example: '2024-12-31T23:59:59Z'
  })
  @IsOptional()
  @IsDateString()
  to?: Date;
}
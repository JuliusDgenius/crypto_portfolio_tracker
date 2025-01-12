// src/alerts/dto/alert-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { Alert, AlertStatus, AlertType } from '../types/alert.type';

/**
 * DTO for API responses containing alert data
 * Mirrors the Alert interface but as a class for Swagger documentation
 */
export class AlertResponseDto implements Alert {
  @ApiProperty({
    description: 'Unique identifier of the alert',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'ID of the user who created the alert',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  userId: string;

  @ApiProperty({
    description: 'Type of the alert',
    enum: AlertType,
    example: AlertType.PRICE
  })
  type: AlertType;

  @ApiProperty({
    description: 'Current status of the alert',
    enum: AlertStatus,
    example: AlertStatus.ACTIVE
  })
  status: AlertStatus;

  @ApiProperty({
    description: 'Alert-specific conditions',
    example: {
      cryptocurrency: 'BTC',
      price: 50000,
      comparison: 'ABOVE'
    }
  })
  conditions: Record<string, any>;

  @ApiProperty({
    description: 'Notification preferences for this alert'
  })
  notification: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  lastTriggered?: Date;

  @ApiProperty({ required: false })
  watchlistIds?: string[];
}
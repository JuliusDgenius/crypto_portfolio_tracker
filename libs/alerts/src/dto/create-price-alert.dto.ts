import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationPreferencesDto } from './notification-preferences.dto';
import { PriceAlertCondition } from '../interfaces/alert-conditions.interface';
import { AlertType } from '../types/alert.type';
import { AlertNotification } from '../interfaces';

/**
 * Enum for price comparison operations
 * Defines how the current price should be compared to the target price
 */
export enum PriceComparison {
  ABOVE = 'ABOVE',
  BELOW = 'BELOW'
}

/**
 * DTO for creating a new price alert
 * Implements parts of the PriceAlertCondition interface while adding notification preferences
 */
export class CreatePriceAlertDto {
  @ApiProperty({
    description: 'The cryptocurrency symbol to monitor (e.g., BTC, ETH)',
    example: 'BTC',
    required: true,
    minLength: 2,
    maxLength: 10
  })
  @IsString()
  cryptocurrency: string;

  @ApiProperty({
    description: 'The target price that will trigger the alert',
    example: 50000,
    required: true,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Whether to trigger when price goes above or below the target',
    enum: PriceComparison,
    example: PriceComparison.ABOVE,
    required: true
  })
  @IsEnum(PriceComparison)
  comparison: PriceComparison;

  @ApiProperty({
    description: 'Notification preferences for this alert',
    type: NotificationPreferencesDto,
    required: true
  })
  @ValidateNested()
  @Type(() => NotificationPreferencesDto)
  notification: AlertNotification;

  /**
   * Converts the DTO to a PriceAlertCondition object
   * This helps maintain consistency when creating alerts
   */
  toAlertCondition(): PriceAlertCondition {
    return {
      type: AlertType.PRICE,
      cryptocurrency: this.cryptocurrency,
      price: this.price,
      comparison: this.comparison
    };
  }
}
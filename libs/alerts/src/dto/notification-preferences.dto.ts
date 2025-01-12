import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { NotificationPreferences } from '../interfaces';

/**
 * DTO for handling notification preferences when creating or updating alerts
 * Implements the NotificationPreferences interface to ensure type consistency
 */
export class NotificationPreferencesDto implements NotificationPreferences {
  @ApiProperty({
    description: 'Whether to send email notifications when the alert triggers',
    example: true,
    required: true
  })
  @IsBoolean()
  email: boolean;

  @ApiProperty({
    description: 'Whether to send push notifications when the alert triggers',
    example: false,
    required: true
  })
  @IsBoolean()
  push: boolean;

  @ApiProperty({
    description: 'Whether to send SMS notifications when the alert triggers',
    example: false,
    required: true
  })
  @IsBoolean()
  sms: boolean;
}
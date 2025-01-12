import { Alert } from '../types/alert.type';

/**
 * Defines the available notification channels in the system
 */
export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH'
}

/**
 * Represents the structure of a notification message
 */
export interface NotificationContent {
  subject: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Represents a complete notification to be sent
 */
export interface AlertNotification {
  alert: Alert;
  content: NotificationContent;
  channels: NotificationChannel[];
  sentAt: Date;
}

/**
 * Tracks the delivery status of a notification
 */
export interface NotificationDeliveryStatus {
  notificationId: string;
  channel: NotificationChannel;
  status: 'PENDING' | 'SENT' | 'FAILED';
  error?: string;
  deliveredAt?: Date;
}

/**
 * Represents a user's notification preferences
 * Stored in the notification field of the Alert model
 */
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
}
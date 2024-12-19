/**
 * Alert model interface
 */
export interface IAlert {
  id: string;
  userId: string;
  type: AlertType;
  status: AlertStatus;
  conditions: AlertConditions;
  notification: NotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
}

export enum AlertType {
  PRICE = 'PRICE',
  PORTFOLIO = 'PORTFOLIO',
  SYSTEM = 'SYSTEM'
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  TRIGGERED = 'TRIGGERED',
  DISABLED = 'DISABLED'
}

export interface AlertConditions {
  cryptocurrency?: string;
  price?: number;
  comparison?: 'above' | 'below';
  portfolioValue?: number;
  percentageChange?: number;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
} 
/**
 * Defines the core types of alerts supported by the system.
 * Matches the AlertType enum in our Prisma schema.
 */
export enum AlertType {
  PRICE = 'PRICE',
  PORTFOLIO = 'PORTFOLIO',
  SYSTEM = 'SYSTEM'
}

/**
 * Defines the possible states an alert can be in.
 * Matches the AlertStatus enum in our Prisma schema.
 */
export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  TRIGGERED = 'TRIGGERED',
  DISABLED = 'DISABLED'
}

/**
 * Represents the core structure of an alert in our system.
 * Maps directly to the Alert model in our Prisma schema.
 */
export interface Alert {
  id: string;
  userId: string;
  type: AlertType;
  status: AlertStatus;
  conditions: Record<string, any>; // Type-specific conditions stored as JSON
  notification: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
  watchlistIds?: string[];
}

/**
 * Type guard to check if an alert exists and has valid required properties
 */
export function isValidAlert(alert: any): alert is Alert {
  return (
    alert &&
    typeof alert.id === 'string' &&
    typeof alert.userId === 'string' &&
    Object.values(AlertType).includes(alert.type) &&
    Object.values(AlertStatus).includes(alert.status) &&
    typeof alert.conditions === 'object' &&
    typeof alert.notification === 'object'
  );
}
/**
 * Defines the core types of alerts supported by the system.
 * Matches the AlertType enum in Prisma schema.
 * @enum {string}
 */
export enum AlertType {
  PRICE = 'PRICE',
  PORTFOLIO = 'PORTFOLIO',
  SYSTEM = 'SYSTEM'
}

/**
 * Defines the possible states an alert can be in.
 * Matches the AlertStatus enum in Prisma schema.
 * @enum {string}
 */
export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  TRIGGERED = 'TRIGGERED',
  DISABLED = 'DISABLED'
}

/**
 * Represents the core structure of an alert in our system.
 * Maps directly to the Alert model in Prisma schema.
 * @interface Alert
 * @property {string} id - The unique identifier for the alert.
 * @property {string} userId - The identifier of the user who created the alert.
 * @property {AlertType} type - The type of the alert.
 * @property {AlertStatus} status - The current status of the alert.
 * @property {Record<string, any>} conditions - Type-specific conditions stored as JSON.
 * @property {Object} notification - Notification preferences for the alert.
 * @property {boolean} notification.email - Whether to send email notifications.
 * @property {boolean} notification.push - Whether to send push notifications.
 * @property {boolean} notification.sms - Whether to send SMS notifications.
 * @property {Date} createdAt - The date the alert was created.
 * @property {Date} updatedAt - The date the alert was last updated.
 * @property {Date} [lastTriggered] - The date the alert was last triggered.
 * @property {string[]} [watchlistIds] - Optional list of watchlist IDs associated with the alert.
 */
export interface Alert {
  id: string;
  userId: string;
  type: AlertType;
  status: AlertStatus;
  conditions: Record<string, any>;
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
 * Type guard to check if an alert exists and has valid required properties.
 * @param {any} alert - The alert to validate.
 * @returns {alert is Alert} - Returns true if the alert is valid, otherwise false.
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
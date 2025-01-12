import { Alert as PrismaAlert } from '@prisma/client';
import { Alert, AlertType, AlertStatus } from '../types/alert.type';
import { NotificationPreferences } from '../interfaces/alert-notification.interface';
import { AlertValidator } from '../alert.validator';

/**
 * Mapper class for converting Prisma alerts to domain alerts.
 */
export class AlertMapper {
  /**
   * Converts a Prisma alert to a domain alert.
   * @param {PrismaAlert} prismaAlert - The Prisma alert to convert.
   * @returns {Alert} The converted domain alert.
   */
  static toDomain(prismaAlert: PrismaAlert): Alert {
    // The 'as AlertType' cast is safe here because we know the values match
    const alert = {
      id: prismaAlert.id,
      userId: prismaAlert.userId,
      type: prismaAlert.type as AlertType,
      status: prismaAlert.status as AlertStatus,
      conditions: this.parseJsonValue(prismaAlert.conditions),
      notification: this.parseNotificationPreferences(prismaAlert.notification),
      createdAt: prismaAlert.createdAt,
      updatedAt: prismaAlert.updatedAt,
      lastTriggered: prismaAlert.lastTriggered,
      watchlistIds: prismaAlert.watchlistIds ?? [],
    };

    if (!AlertValidator.validateDomainAlert(alert)) {
        throw new Error('Invalid alert data structure');
    }

    return alert;
  }

  /**
   * Safely parses JSON values.
   * @param {any} json - The JSON value to parse.
   * @returns {Record<string, any>} The parsed JSON object or an empty object if parsing fails.
   */
  private static parseJsonValue(json: any): Record<string, any> {
    try {
      return typeof json === 'object' ? json : JSON.parse(json);
    } catch {
      return {};
    }
  }

  /**
   * Parses notification preferences from a JSON value.
   * @param {any} json - The JSON value containing notification preferences.
   * @returns {NotificationPreferences} The parsed notification preferences.
   */
  private static parseNotificationPreferences(json: any): NotificationPreferences {
    const preferences = this.parseJsonValue(json);
    return {
      email: Boolean(preferences.email),
      push: Boolean(preferences.push),
      sms: Boolean(preferences.sms),
    };
  }
}
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/src';
import { NotificationService } from './alert-notification.service'
import { 
  AlertCondition,
  AlertNotification
} from '../interfaces';
import { AlertProcessorService } from './alert-processor.service';
import {
  AlertType, 
  AlertStatus,
  Alert,
  isValidAlert
} from '../types'

/**
 * Service for managing alerts.
 */
@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertProcessorService: AlertProcessorService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Create a new alert based on provided conditions.
   * @param userId - The ID of the user creating the alert.
   * @param type - The type of the alert.
   * @param conditions - The conditions that trigger the alert.
   * @param notification - The notification settings for the alert.
   * @returns A promise that resolves to the created alert.
   * @throws Error if the alert conditions are invalid or the created alert does not match expected structure.
   */
  async createAlert(
    userId: string,
    type: AlertType,
    conditions: AlertCondition,
    notification: AlertNotification
  ): Promise<Alert> {
    try {
      // Validate the alert conditions
      const isValid = await this.alertProcessorService.validateAlertConditions(conditions);
      if (!isValid) {
        throw new Error('Invalid alert conditions');
      }

      // Create new alert in database
      const prismaAlert = await this.prisma.alert.create({
        data: {
          userId,
          type,
          status: AlertStatus.ACTIVE,
          conditions: conditions as any, // Prisma handles JSON conversion
          notification: notification as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const alert = this.convertPrismaAlertToDomain(prismaAlert)

      if (!isValidAlert(alert)) {
        throw new Error('Created alert does not match expected structure');
      }

      this.logger.log(`Created new alert with ID ${alert.id}`);
      return alert;
    } catch (error) {
      this.logger.error(`Error creating alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process all active alerts.
   * @returns A promise that resolves when all active alerts have been processed.
   * @throws Error if there is an error processing active alerts.
   */
  async processActiveAlerts(): Promise<void> {
    try {
      const prismaAlerts = await this.prisma.alert.findMany({
        where: { status: AlertStatus.ACTIVE }
      });

      const activeAlerts = prismaAlerts
      .map(this.convertPrismaAlertToDomain)
      .filter(isValidAlert)

      for (const alert of activeAlerts) {
        const isTriggered = await this.alertProcessorService.processAlert(alert);
        
        if (isTriggered) {
          await this.updateAlertStatus(alert.id, alert.userId, AlertStatus.TRIGGERED);
          await this.notificationService.sendAlertNotifications(alert);
        }
      }
    } catch (error) {
      this.logger.error(`Error processing active alerts: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update alert status.
   * @param alertId - The ID of the alert to update.
   * @param userId - The ID of the user who owns the alert.
   * @param status - The new status for the alert.
   * @returns A promise that resolves to the updated alert.
   * @throws Error if the updated alert does not match expected structure.
   */
  async updateAlertStatus(
    alertId: string,
    userId: string,
    status: AlertStatus,
  ): Promise<Alert> {
    try {
      const updatedAlert = await this.prisma.alert.update({
        where: { 
          id: alertId,
          userId,
        },
        data: {
          status,
          updatedAt: new Date(),
          ...(status === AlertStatus.TRIGGERED && { lastTriggered: new Date()}),
        },
      });

      // Validate updated alert
      if (!isValidAlert(updatedAlert)) {
        throw new Error('Updated alert does not match expected structure');
      }

      if (status === AlertStatus.TRIGGERED) {
        await this.notificationService.sendAlertNotifications(updatedAlert);
      }
      
      return updatedAlert;  
    } catch (error) {
      this.logger.error(`Error updating alert status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get alerts for a user with optional filters.
   * @param userId - The ID of the user whose alerts are to be fetched.
   * @param filters - Optional filters for fetching alerts.
   * @returns A promise that resolves to an array of alerts.
   * @throws Error if there is an error fetching user alerts.
   */
  async getUserAlerts(
    userId: string,
    filters?: {
      type?: AlertType;
      status?: AlertStatus;
      from?: Date;
      to?: Date;
    }
  ): Promise<Alert[]> {
    try {
      const where: Prisma.AlertWhereInput = { userId };

      if (filters?.type) {
        where.type = filters.type;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.from || filters?.to) {
        where.createdAt = {};
        if (filters.from) {
          where.createdAt = { ...where.createdAt, gte: filters.from };
        }
        if (filters.to) {
          where.createdAt = { ...where.createdAt, lte: filters.to };
        }
      }

      const prismaAlerts = await this.prisma.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      // convert and validate all alerts
      return prismaAlerts
        .map(this.convertPrismaAlertToDomain)
        .filter(isValidAlert);
    } catch (error) {
      this.logger.error(`Error fetching user alerts: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Convert Prisma Alert to our domain Alert type.
   * @param prismaAlert - The Prisma alert object to convert.
   * @returns The converted alert in the domain format.
   */
  private convertPrismaAlertToDomain(prismaAlert: any): Alert {
    return {
      id: prismaAlert.id,
      userId: prismaAlert.userId,
      type: prismaAlert.type as AlertType,
      status: prismaAlert.status as AlertStatus,
      conditions: prismaAlert.conditions as Record<string, any>,
      notification: {
        email: prismaAlert.notification?.email ?? false,
        push: prismaAlert.notification?.push ?? false,
        sms: prismaAlert.notification?.sms ?? false,
      },
      createdAt: prismaAlert.createdAt,
      updatedAt: prismaAlert.updatedAt,
      lastTriggered: prismaAlert.lastTriggered ?? undefined,
      watchlistIds: prismaAlert.watchlistIds ?? [],
    };
  }
}
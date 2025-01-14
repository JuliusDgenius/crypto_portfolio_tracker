import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Handlebars from 'handlebars';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from '../../../database/src';
import {
  NotificationChannel,
  NotificationContent,
  AlertNotification,
  NotificationDeliveryStatus,
  NotificationPreferences,
} from '../interfaces';
import { Alert } from '../types';
import { templateHelpers } from '../helpers/template.helpers';

/**
 * Service for managing and sending alert notifications.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.registerTemplateHelpers();
  }

  /**
   * Creates and sends notifications for an alert through configured channels.
   * Handles the complete lifecycle of notification delivery and status tracking.
   * @param {Alert} alert - The alert for which notifications are to be sent.
   * @returns {Promise<NotificationDeliveryStatus[]>} A promise that resolves to an array of notification delivery statuses.
   */
  async sendAlertNotifications(alert: Alert): Promise<NotificationDeliveryStatus[]> {
    try {
      // Generate notification content based on alert type
      const content = await this.generateNotificationContent(alert);

      // Determine which channels to use based on alert preferences
      const channels = this.determineNotificationChannels(alert);

      // Create notification record
      const notification: AlertNotification = {
        alert,
        content,
        channels,
        sentAt: new Date(),
      };

      // Send through each channel and track status
      const deliveryPromises = channels.map(channel =>
        this.deliverNotification(notification, channel)
      );

      // Wait for all notifications to be sent
      const deliveryStatuses = await Promise.all(deliveryPromises);

      // Log delivery results
      this.logDeliveryResults(deliveryStatuses);

      return deliveryStatuses;
    } catch (error) {
      this.logger.error(
        `Failed to send notifications for alert ${alert.id}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Generates appropriate notification content based on alert type and data.
   * @param {Alert} alert - The alert for which to generate notification content.
   * @returns {Promise<NotificationContent>} A promise that resolves to the generated notification content.
   */
  private async generateNotificationContent(
    alert: Alert
  ): Promise<NotificationContent> {
    const templates = {
      PRICE: {
        subject: 'Price Alert Triggered',
        bodyTemplate: 'The price has reached ${price} for ${symbol}',
        data: {
          ...alert.conditions,
          currentPrice: alert.conditions.currentPrice,
          targetPrice: alert.conditions.targetPrice || alert.conditions.price
        }
      },
      VOLUME: {
        subject: 'Volume Alert Triggered',
        bodyTemplate: 'Trading volume has exceeded ${volume} for ${symbol}',
      },
      // Add more alert type templates as needed
    };

    const template = templates[alert.type] || {
      subject: 'Alert Triggered',
      bodyTemplate: 'Your alert has been triggered',
    };

    return {
      subject: template.subject,
      body: this.interpolateTemplate(template.bodyTemplate, template.data),
      data: template.data,
    };
  }

  /**
   * Determines which notification channels to use based on alert preferences.
   * @param {Alert} alert - The alert containing notification preferences.
   * @returns {NotificationChannel[]} An array of notification channels to be used.
   */
  private determineNotificationChannels(alert: Alert): NotificationChannel[] {
    const channels: NotificationChannel[] = [];
    
    if (alert.notification.email) {
      channels.push(NotificationChannel.EMAIL);
    }
    if (alert.notification.push) {
      channels.push(NotificationChannel.PUSH);
    }
    if (alert.notification.sms) {
      channels.push(NotificationChannel.SMS);
    }

    return channels;
  }

  /**
   * Delivers notification through specified channel and tracks status.
   * @param {AlertNotification} notification - The notification to be delivered.
   * @param {NotificationChannel} channel - The channel through which to deliver the notification.
   * @returns {Promise<NotificationDeliveryStatus>} A promise that resolves to the delivery status of the notification.
   */
  private async deliverNotification(
    notification: AlertNotification,
    channel: NotificationChannel
  ): Promise<NotificationDeliveryStatus> {
    const deliveryStatus: NotificationDeliveryStatus = {
      notificationId: notification.alert.id,
      channel,
      status: 'PENDING',
    };

    try {
      switch (channel) {
        case NotificationChannel.EMAIL:
          await this.sendEmail(notification);
          break;
        case NotificationChannel.PUSH:
          await this.sendPushNotification(notification);
          break;
        case NotificationChannel.SMS:
          await this.sendSMS(notification);
          break;
      }

      deliveryStatus.status = 'SENT';
      deliveryStatus.deliveredAt = new Date();
    } catch (error) {
      deliveryStatus.status = 'FAILED';
      deliveryStatus.error = error.message;
      this.logger.error(
        `Failed to deliver ${channel} notification`,
        error.stack
      );
    }

    // TODO: Store delivery status in database
    // await this.prisma.notificationDelivery.create({
    //   data: deliveryStatus,
    // });

    return deliveryStatus;
  }

  private registerTemplateHelpers(): void {
    try {
      Object.entries(templateHelpers).forEach(([name, helper]) => {
        Handlebars.registerHelper(name, helper);
        this.logger.debug(`Registered template helper: ${name}`);
      });
    } catch (error) {
      this.logger.error('Failed to register template helpers', error.stack);
      throw new Error('Template helper registration failed');
    }
  }

  /**
   * Sends notification via email.
   * @param {AlertNotification} notification - The notification to be sent via email.
   * @returns {Promise<void>} A promise that resolves when the email has been sent.
   */
  private async sendEmail(notification: AlertNotification): Promise<void> {
    const { alert, content } = notification;
    const userEmail = await this.getUserEmail(alert.userId);

    try {
      const templateName = `alerts/alert-${alert.type.toLowerCase()}`;

      // Prepare email context with additional metadata
      const emailContext = {
        data: content.data,
        currentPrice: content.data.currentPrice,
        targetPrice: content.data.targetPrice || content.data.price,
        alert,
        triggeredAt: new Date(),
        notificationPreferences: alert.notification as NotificationPreferences,
      };

      console.log('Email context being sent to template:', emailContext);


      await this.mailerService.sendMail({
        to: userEmail,
        subject: content.subject,
        template: templateName,
        context: emailContext,
      })

      // Log successful email delivery
      // await this.logEmailDelivery({
      //   userId: alert.userId,
      //   alertId: alert.id,
      //   email: userEmail,
      //   templateName,
      //   status: 'DELIVERED',
      // });
    } catch (error) {
      // Log failed email delivery
      // await this.logEmailDelivery({
      //   userId: alert.userId,
      //   alertId: alert.id,
      //   email: userEmail,
      //   templateName: `alert-${alert.type.toLowerCase()}`,
      //   status: 'FAILED',
      //   error: error.message,
      // });
      
      throw error;
    }
  }

  /**
   * Sends notification via push notification service.
   * @param {AlertNotification} notification - The notification to be sent via push notification.
   * @returns {Promise<void>} A promise that resolves when the push notification has been sent.
   * @throws {Error} Throws an error if the push notification implementation is pending.
   */
  private async sendPushNotification(notification: AlertNotification): Promise<void> {
    // Implementation would integrate with your push notification service
    // (e.g., Firebase Cloud Messaging, OneSignal, etc.)
    throw new Error('Push notification implementation pending');
  }

  /**
   * Sends notification via SMS.
   * @param {AlertNotification} notification - The notification to be sent via SMS.
   * @returns {Promise<void>} A promise that resolves when the SMS has been sent.
   * @throws {Error} Throws an error if the SMS implementation is pending.
   */
  private async sendSMS(notification: AlertNotification): Promise<void> {
    // Implementation would integrate with your SMS service
    // (e.g., Twilio, MessageBird, etc.)
    throw new Error('SMS implementation pending');
  }

  /**
   * Helper method to get user's email.
   * @param {string} userId - The ID of the user whose email is to be retrieved.
   * @returns {Promise<string>} A promise that resolves to the user's email.
   * @throws {Error} Throws an error if the user is not found.
   */
  private async getUserEmail(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user.email;
  }

  /**
   * Helper method to interpolate template strings with data.
   * @param {string} template - The template string to interpolate.
   * @param {Record<string, unknown>} data - The data to use for interpolation.
   * @returns {string} The interpolated string.
   */
  private interpolateTemplate(
    template: string,
    data: Record<string, unknown>
  ): string {
    return template.replace(/\${(\w+)}/g, (_, key) => String(data[key] || ''));
  }

  /**
   * Helper method to log delivery results.
   * @param {NotificationDeliveryStatus[]} statuses - The delivery statuses to log.
   */
  private logDeliveryResults(statuses: NotificationDeliveryStatus[]): void {
    const successful = statuses.filter(s => s.status === 'SENT').length;
    const failed = statuses.filter(s => s.status === 'FAILED').length;
    
    this.logger.log(
      `Notification delivery complete: ${successful} successful, ${failed} failed`
    );
    
    if (failed > 0) {
      const errors = statuses
        .filter(s => s.status === 'FAILED')
        .map(s => `${s.channel}: ${s.error}`);
      this.logger.warn('Failed deliveries:', errors);
    }
  }

  // private async logEmailDelivery(data: EmailDeliveryLog): Promise<void> {
  //   await this.prisma.notificationDelivery.create({
  //     data: {
  //       channel: 'EMAIL',
  //       ...data,
  //     },
  //   });
  // }
}
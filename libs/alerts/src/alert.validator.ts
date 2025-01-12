import { AlertStatus, AlertType, Alert } from "./types";

// alert.validator.ts
export class AlertValidator {
    static validateDomainAlert(alert: Alert): boolean {
      return (
        Boolean(alert) &&
        typeof alert.id === 'string' &&
        typeof alert.userId === 'string' &&
        Object.values(AlertType).includes(alert.type) &&
        Object.values(AlertStatus).includes(alert.status) &&
        typeof alert.conditions === 'object' &&
        typeof alert.notification === 'object'
      );
    }
  }
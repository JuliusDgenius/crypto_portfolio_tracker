import { Injectable, Logger } from '@nestjs/common';
import { 
  Alert,
} from '../types/alert.type';
import {
  AlertCondition,
  ConditionEvaluationResult,
  isPriceAlertCondition,
  isPortfolioAlertCondition,
  isSystemAlertCondition,
} from '../interfaces';
import { PriceAlertProcessor, PortfolioAlertProcessor, SystemAlertProcessor } from '../processors';

@Injectable()
export class AlertProcessorService {
  private readonly logger = new Logger(AlertProcessorService.name);

  constructor(
    private readonly priceAlertProcessor: PriceAlertProcessor,
    private readonly portfolioAlertProcessor: PortfolioAlertProcessor,
    private readonly systemAlertProcessor: SystemAlertProcessor,
  ) {}

  /**
   * Processes a single alert and sends notifications if triggered
   * Returns true if the alert was triggered
   */
  async processAlert(alert: Alert): Promise<boolean> {
    try {
      this.logger.error('DIAGNOSTIC: Processing alert', {
        alertId: alert.id,
        alertType: alert.type,
        conditions: alert.conditions
      });

      // Evaluate alert conditions
      const result = await this.evaluateAlertConditions(alert.conditions as AlertCondition);

    this.logger.error('DIAGNOSTIC: Alert processing result', {
      alertId: alert.id,
      isTriggered: result.isTriggered
    });

      if (result.isTriggered) {
       alert.conditions ={
        ...alert.conditions,
        currentPrice: result.currentValue,
        evaluatedAt: result.triggeredAt
       } 
      }

      return result.isTriggered;
    } catch (error) {
      this.logger.error(`Error processing alert ${alert.id}`, error.stack);
      return false;
    }
  }

  /**
   * Validates alert conditions based on alert type
   */
  async validateAlertConditions(conditions: AlertCondition): Promise<boolean> {
    try {

      this.logger.error('DIAGNOSTIC: Evaluating conditions', {
        conditionType: conditions.type,
        isPriceAlert: isPriceAlertCondition(conditions),
        isPortfolioAlert: isPortfolioAlertCondition(conditions),
        isSystemAlert: isSystemAlertCondition(conditions),
        rawConditions: conditions
      });

      if (isPriceAlertCondition(conditions)) {
        return this.priceAlertProcessor.validateConditions(conditions);
      } else if (isPortfolioAlertCondition(conditions)) {
        return this.portfolioAlertProcessor.validateConditions(conditions);
      } else if (isSystemAlertCondition(conditions)) {
        return this.systemAlertProcessor.validateConditions(conditions);
      }
      return false;
    } catch (error) {
      this.logger.error('Error validating alert conditions', error.stack);
      return false;
    }
  }

  /**
   * Evaluates alert conditions based on alert type
   */
  private async evaluateAlertConditions(conditions: AlertCondition): Promise<ConditionEvaluationResult> {
    try {
      if (isPriceAlertCondition(conditions)) {
        this.logger.error('DIAGNOSTIC: Routing to price alert processor');
        return this.priceAlertProcessor.evaluateConditions(conditions);
      } else if (isPortfolioAlertCondition(conditions)) {
        return this.portfolioAlertProcessor.evaluateConditions(conditions);
      } else if (isSystemAlertCondition(conditions)) {
        return this.systemAlertProcessor.evaluateConditions(conditions);
      }
      throw new Error('Unknown alert type');
    } catch (error) {
      this.logger.error('Error evaluating alert conditions', error.stack);
      throw error;
    }
  }
}
import { AlertType } from '../types/alert.type';

/**
 * Base interface for all alert conditions
 * Ensures type safety when processing different kinds of alerts
 */
export interface BaseCondition {
  type: AlertType;
}

/**
 * Conditions specific to price alerts
 * Used for monitoring cryptocurrency price movements
 */
export interface PriceAlertCondition extends BaseCondition {
  type: AlertType.PRICE;
  cryptocurrency: string;
  targetPrice: number;
  currentPrice?: number;
  comparison: 'ABOVE' | 'BELOW';
}

/**
 * Conditions specific to portfolio alerts
 * Used for monitoring portfolio metrics like value and performance
 */
export interface PortfolioAlertCondition extends BaseCondition {
  type: AlertType.PORTFOLIO;
  portfolioId: string;
  threshold: number;
  metricType: 'TOTAL_VALUE' | 'DAILY_CHANGE' | 'VOLATILITY';
}

/**
 * Conditions specific to system alerts
 * Used for monitoring system health and errors
 */
export interface SystemAlertCondition extends BaseCondition {
  type: AlertType.SYSTEM;
  componentId: string;
  errorCode?: string;
  message: string;
}

/**
 * Union type representing all possible alert conditions
 */
export type AlertCondition = 
  | PriceAlertCondition 
  | PortfolioAlertCondition 
  | SystemAlertCondition;

/**
 * Represents the result of evaluating alert conditions
 * Used by alert processors to communicate evaluation results
 */
export interface ConditionEvaluationResult {
  isTriggered: boolean;
  currentValue?: number | string;
  triggeredAt: Date;
  metadata?: Record<string, unknown>;
  error?: string;
}

/**
 * Type guards for each alert condition type
 */
export function isPriceAlertCondition(
  condition: AlertCondition
): condition is PriceAlertCondition {
  return condition.type === AlertType.PRICE;
}

export function isPortfolioAlertCondition(
  condition: AlertCondition
): condition is PortfolioAlertCondition {
  return condition.type === AlertType.PORTFOLIO;
}

export function isSystemAlertCondition(
  condition: AlertCondition
): condition is SystemAlertCondition {
  return condition.type === AlertType.SYSTEM;
}
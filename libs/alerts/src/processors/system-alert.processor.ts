import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/src';
import {
  SystemAlertCondition,
  ConditionEvaluationResult
} from '../interfaces/alert-conditions.interface';

@Injectable()
export class SystemAlertProcessor {
  private readonly logger = new Logger(SystemAlertProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates system alert conditions before creation
   * Checks for required fields and valid component references
   */
  async validateConditions(conditions: SystemAlertCondition): Promise<boolean> {
    try {
      // Check for required fields
      if (!conditions.componentId || !conditions.message) {
        this.logger.warn('Missing required fields in system alert conditions');
        return false;
      }

      // Validate that the component exists in the system
      const isValidComponent = await this.validateSystemComponent(conditions.componentId);
      if (!isValidComponent) {
        this.logger.warn(`Invalid system component: ${conditions.componentId}`);
        return false;
      }

      // If error code is provided, validate it's in the known error codes
      if (conditions.errorCode) {
        const isValidErrorCode = await this.validateErrorCode(conditions.errorCode);
        if (!isValidErrorCode) {
          this.logger.warn(`Invalid error code: ${conditions.errorCode}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error('Error validating system alert conditions', error.stack);
      return false;
    }
  }

  /**
   * Evaluates system alert conditions against current system state
   * Checks component health and error conditions
   */
  async evaluateConditions(conditions: SystemAlertCondition): Promise<ConditionEvaluationResult> {
    try {
      // Get current system component status
      const componentStatus = await this.getComponentStatus(conditions.componentId);
      
      // Check if component is in error state
      const isError = componentStatus.status === 'ERROR';
      
      // If specific error code is being monitored, check for match
      const hasMatchingError = conditions.errorCode 
        ? componentStatus.errorCode === conditions.errorCode
        : false;

      // Alert should trigger if either:
      // 1. Component is in error state and we're not looking for specific error
      // 2. Component has the specific error we're monitoring
      const isTriggered = isError && (!conditions.errorCode || hasMatchingError);

      return {
        isTriggered,
        currentValue: componentStatus.status,
        triggeredAt: new Date(),
        metadata: {
          componentId: conditions.componentId,
          errorCode: componentStatus.errorCode,
          lastHealthCheck: componentStatus.lastHealthCheck,
          message: conditions.message
        }
      };
    } catch (error) {
      this.logger.error('Error evaluating system alert conditions', error.stack);
      return {
        isTriggered: false,
        triggeredAt: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Validates that a system component exists and is monitored
   */
  private async validateSystemComponent(componentId: string): Promise<boolean> {
    try {
      // TODO: Implement when systemComponent model is added to Prisma schema
      // const component = await this.prisma.systemComponent.findUnique({
      //   where: { id: componentId }
      // });
      // return !!component;
      return true; // Temporary fix until model is added
    } catch (error) {
      this.logger.error('Error validating system component', error.stack);
      return false;
    }
  }

  /**
   * Validates that an error code is known to the system
   */
  private async validateErrorCode(errorCode: string): Promise<boolean> {
    try {
      // TODO: Implement when systemErrorCode model is added to Prisma schema
      // const knownError = await this.prisma.systemErrorCode.findUnique({
      //   where: { code: errorCode }
      // });
      // return !!knownError;
      return true; // Temporary fix until model is added
    } catch (error) {
      this.logger.error('Error validating error code', error.stack);
      return false;
    }
  }

  /**
   * Retrieves current status of a system component
   */
  private async getComponentStatus(componentId: string): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'ERROR';
    errorCode?: string;
    lastHealthCheck: Date;
  }> {
    try {
      // TODO: Implement when systemComponent model is added to Prisma schema
      // const status = await this.prisma.systemComponent.findUnique({
      //   where: { id: componentId },
      //   select: {
      //     status: true,
      //     errorCode: true,
      //     lastHealthCheck: true
      //   }
      // });
      // 
      // if (!status) {
      //   throw new Error(`Component not found: ${componentId}`);
      // }
      // 
      // return {
      //   status: status.status as 'HEALTHY' | 'WARNING' | 'ERROR',
      //   errorCode: status.errorCode,
      //   lastHealthCheck: status.lastHealthCheck
      // };
      
      // Temporary mock implementation
      return {
        status: 'HEALTHY' as const,
        errorCode: undefined,
        lastHealthCheck: new Date()
      };
    } catch (error) {
      this.logger.error('Error fetching component status', error.stack);
      throw new Error(`Failed to get status for component ${componentId}: ${error.message}`);
    }
  }
}
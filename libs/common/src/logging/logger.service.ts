import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { createLogger, Logger, format, transports } from 'winston';
import { WinstonConfigService } from './winston-config.service';
import * as cls from 'cls-hooked';
import { LOGGING_NAMESPACE, SENSITIVE_FIELDS } from './constants';
import { performance } from 'perf_hooks';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private logger: Logger;
  private namespace: cls.Namespace;

  constructor(private configService: WinstonConfigService) {
    this.namespace = cls.createNamespace(LOGGING_NAMESPACE);
    this.logger = createLogger({
      defaultMeta: {
        service: 'crypto-portfolio-tracker',
        environment: process.env.NODE_ENV,
        version: process.env.APP_VERSION || '1.0.0'
      },
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        this.createSensitiveDataMask(),
        this.createPerformanceFormat(),
        format.metadata(),
        format.json()
      ),
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(this.createLogPrinter())
          ),
        }),
        new transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880,
          maxFiles: 5,
        }),
        new transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880,
          maxFiles: 5,
        }),
        // Optional HTTP transport for log aggregation
        ...(this.configService.isLogAggregationEnabled() ? [
          new transports.Http({
            host: process.env.LOG_AGGREGATOR_HOST,
            port: Number(process.env.LOG_AGGREGATOR_PORT),
            ssl: process.env.NODE_ENV === 'production',
            batch: true,
            batchCount: 100,
            batchInterval: 5000,
          })
        ] : [])
      ],
      exitOnError: false
    });
  }

  private createSensitiveDataMask() {
    return format((info) => {
      if (info.metadata) {
        this.maskSensitiveData(info.metadata);
      }
      return info;
    })();
  }

  private maskSensitiveData(obj: any, depth = 0) {
    if (depth > 3) return; // Prevent circular references
    
    Object.keys(obj).forEach(key => {
      if (SENSITIVE_FIELDS.includes(key)) {
        obj[key] = '***';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.maskSensitiveData(obj[key], depth + 1);
      }
    });
  }

  private createPerformanceFormat() {
    return format((info: any) => {
      const startTime = this.namespace.get('startTime');
      if (startTime) {
        info.metadata = info.metadata || {};
        info.metadata.duration = `${performance.now() - startTime}ms`;
      }
      return info;
    })();
  }

  private createLogPrinter() {
    return (info: any) => {
      const requestId = this.getRequestId();
      const duration = info.metadata?.duration ? ` [${info.metadata.duration}]` : '';
      const metaStr = info.metadata ? ` ${JSON.stringify(info.metadata)}` : '';
      
      return `[${info.timestamp}] ${info.level} [${requestId}]${duration}: ${info.message}${metaStr}`;
    };
  }

  private getRequestId(): string {
    return this.namespace.get('requestId') || 'no-request-id';
  }

  log(message: string, context?: string, metadata?: any): void {
    this.logger.info(message, {
      context,
      requestId: this.getRequestId(),
      ...this.enrichMetadata(metadata)
    });
  }

  error(message: string, trace?: string, context?: string, metadata?: any): void {
    this.logger.error(message, {
      trace,
      context,
      requestId: this.getRequestId(),
      ...this.enrichMetadata(metadata)
    });
  }

  warn(message: string, context?: string, metadata?: any): void {
    this.logger.warn(message, {
      context,
      requestId: this.getRequestId(),
      ...this.enrichMetadata(metadata)
    });
  }

  debug(message: string, context?: string, metadata?: any): void {
    this.logger.debug(message, {
      context,
      requestId: this.getRequestId(),
      ...this.enrichMetadata(metadata)
    });
  }

  verbose(message: string, context?: string, metadata?: any): void {
    this.logger.verbose(message, {
      context,
      requestId: this.getRequestId(),
      ...this.enrichMetadata(metadata)
    });
  }

  private enrichMetadata(metadata?: any) {
    return {
      timestamp: Date.now(),
      correlationId: this.namespace.get('correlationId'),
      userId: this.namespace.get('userId'),
      ...metadata
    };
  }
} 
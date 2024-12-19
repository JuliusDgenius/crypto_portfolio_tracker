import { Injectable } from '@nestjs/common';

@Injectable()
export class WinstonConfigService {
  getLogLevel(): string {
    const env = process.env.NODE_ENV || 'development';
    switch (env) {
      case 'production':
        return 'info';
      case 'test':
        return 'error';
      default:
        return 'debug';
    }
  }

  getLogFormat(): string {
    return process.env.NODE_ENV === 'production' ? 'json' : 'pretty';
  }

  isLogAggregationEnabled(): boolean {
    return process.env.ENABLE_LOG_AGGREGATION === 'true';
  }
} 
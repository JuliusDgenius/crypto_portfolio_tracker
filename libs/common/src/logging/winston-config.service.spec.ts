import { Test, TestingModule } from '@nestjs/testing';
import { WinstonConfigService } from './winston-config.service';

describe('WinstonConfigService', () => {
  let service: WinstonConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WinstonConfigService],
    }).compile();

    service = module.get<WinstonConfigService>(WinstonConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLogLevel', () => {
    it('should return info for production', () => {
      process.env.NODE_ENV = 'production';
      expect(service.getLogLevel()).toBe('info');
    });

    it('should return error for test', () => {
      process.env.NODE_ENV = 'test';
      expect(service.getLogLevel()).toBe('error');
    });

    it('should return debug for development', () => {
      process.env.NODE_ENV = 'development';
      expect(service.getLogLevel()).toBe('debug');
    });
  });

  describe('isLogAggregationEnabled', () => {
    it('should return true when enabled', () => {
      process.env.ENABLE_LOG_AGGREGATION = 'true';
      expect(service.isLogAggregationEnabled()).toBe(true);
    });

    it('should return false when disabled', () => {
      process.env.ENABLE_LOG_AGGREGATION = 'false';
      expect(service.isLogAggregationEnabled()).toBe(false);
    });
  });
}); 
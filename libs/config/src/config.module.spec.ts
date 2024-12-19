import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from './config.module';
import { ConfigService } from './config.service';

describe('ConfigModule', () => {
  let module: TestingModule;
  let configService: ConfigService;

  beforeEach(async () => {
    process.env.PORT = '3000';
    process.env.DATABASE_URL = 'mongodb://localhost:27017/test';
    process.env.API_KEY = 'test-api-key';
  });

  describe('Normal initialization', () => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [ConfigModule],
      }).compile();

      configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should provide ConfigService', () => {
      expect(configService).toBeDefined();
    });

    it('should load environment variables', () => {
      expect(configService.port).toBe(3000);
      expect(configService.databaseUrl).toBe('mongodb://localhost:27017/test');
      expect(configService.apiKey).toBe('test-api-key');
    });
  });

  describe('Edge cases', () => {
    it('should throw error for non-numeric PORT', async () => {
      process.env.PORT = 'not-a-number';
      await expect(
        Test.createTestingModule({
          imports: [ConfigModule],
        }).compile()
      ).rejects.toThrow();
    });

    it('should throw error for negative PORT', async () => {
      process.env.PORT = '-3000';
      await expect(
        Test.createTestingModule({
          imports: [ConfigModule],
        }).compile()
      ).rejects.toThrow();
    });

    it('should throw error for empty DATABASE_URL', async () => {
      process.env.DATABASE_URL = '';
      await expect(
        Test.createTestingModule({
          imports: [ConfigModule],
        }).compile()
      ).rejects.toThrow();
    });

    it('should throw error for invalid mongodb DATABASE_URL format', async () => {
      process.env.DATABASE_URL = 'invalid-url';
      await expect(
        Test.createTestingModule({
          imports: [ConfigModule],
        }).compile()
      ).rejects.toThrow();
    });

    it('should accept empty API_KEY as it is optional', async () => {
      delete process.env.API_KEY;
      module = await Test.createTestingModule({
        imports: [ConfigModule],
      }).compile();
      configService = module.get<ConfigService>(ConfigService);
      expect(configService.apiKey).toBeUndefined();
    });

    it('should handle whitespace in environment variables', async () => {
      process.env.DATABASE_URL = '  mongodb://localhost:27017/test  ';
      process.env.API_KEY = '  test-api-key  ';
      
      module = await Test.createTestingModule({
        imports: [ConfigModule],
      }).compile();
      
      configService = module.get<ConfigService>(ConfigService);
      expect(configService.databaseUrl).toBe('mongodb://localhost:27017/test');
      expect(configService.apiKey).toBe('test-api-key');
    });

    it('should throw error when required variables are missing', async () => {
      delete process.env.PORT;
      delete process.env.DATABASE_URL;
      
      await expect(
        Test.createTestingModule({
          imports: [ConfigModule],
        }).compile()
      ).rejects.toThrow();
    });
  });

  describe('ConfigService methods', () => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [ConfigModule],
      }).compile();
      configService = module.get<ConfigService>(ConfigService);
    });

    it('should throw error for undefined config key', () => {
      expect(() => configService.get('UNDEFINED_KEY')).toThrow();
    });

    it('should handle boolean values correctly', () => {
      process.env.FEATURE_FLAG = 'true';
      expect(configService.get('FEATURE_FLAG')).toBe('true');
    });

    it('should handle numeric strings', () => {
      process.env.MAX_CONNECTIONS = '100';
      expect(configService.get('MAX_CONNECTIONS')).toBe('100');
    });
  });

  afterEach(() => {
    delete process.env.PORT;
    delete process.env.DATABASE_URL;
    delete process.env.API_KEY;
    delete process.env.FEATURE_FLAG;
    delete process.env.MAX_CONNECTIONS;
  });
}); 
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(async () => {
    process.env.PORT = '3000';
    process.env.DATABASE_URL = 'mongodb://localhost:27017/test';
    process.env.API_KEY = 'test-api-key';

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        NestConfigModule.forRoot({
          ignoreEnvFile: true,
        }),
      ],
      providers: [ConfigService],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get port number', () => {
    expect(service.port).toBe(3000);
  });

  it('should get database url', () => {
    expect(service.databaseUrl).toBe('mongodb://localhost:27017/test');
  });

  it('should get api key', () => {
    expect(service.apiKey).toBe('test-api-key');
  });

  it('should throw error for undefined config', () => {
    expect(() => service.get('UNDEFINED_KEY')).toThrow();
  });

  afterEach(() => {
    delete process.env.PORT;
    delete process.env.DATABASE_URL;
    delete process.env.API_KEY;
  });
}); 
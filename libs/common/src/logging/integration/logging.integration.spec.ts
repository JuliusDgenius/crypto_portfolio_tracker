import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import { LoggingModule } from '../logging.module';
import { LoggerService } from '../logger.service';
import { LoggingMiddleware } from '../middleware/logging.middleware';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';

// Test Controller
import { Controller, Get, Injectable } from '@nestjs/common';

@Injectable()
class TestService {
  constructor(private logger: LoggerService) {}

  async performOperation() {
    this.logger.log('Operation started', 'TestService');
    await new Promise(resolve => setTimeout(resolve, 100));
    this.logger.log('Operation completed', 'TestService');
    return 'success';
  }
}

@Controller('test')
class TestController {
  constructor(
    private testService: TestService,
    private logger: LoggerService
  ) {}

  @Get()
  async test() {
    this.logger.log('Handling request', 'TestController');
    return this.testService.performOperation();
  }
}

@Module({
  imports: [LoggingModule],
  controllers: [TestController],
  providers: [TestService],
})
class TestModule {}

describe('Logging Integration', () => {
  let app: INestApplication;
  let logPath: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(new LoggingMiddleware().use);
    
    logPath = path.join(process.cwd(), 'logs', 'combined.log');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    // Clean up log files
    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath);
    }
  });

  beforeEach(() => {
    // Clear logs before each test
    if (fs.existsSync(logPath)) {
      fs.truncateSync(logPath);
    }
  });

  it('should log complete request lifecycle with context', async () => {
    await request(app.getHttpServer())
      .get('/test')
      .expect(200);

    const logs = fs.readFileSync(logPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line));

    expect(logs).toHaveLength(3); // Should have 3 log entries

    // Check request context consistency
    const requestId = logs[0].requestId;
    expect(requestId).toBeDefined();
    logs.forEach(log => {
      expect(log.requestId).toBe(requestId);
    });

    // Verify log sequence
    expect(logs[0]).toMatchObject({
      message: 'Handling request',
      context: 'TestController',
      level: 'info'
    });

    expect(logs[1]).toMatchObject({
      message: 'Operation started',
      context: 'TestService',
      level: 'info'
    });

    expect(logs[2]).toMatchObject({
      message: 'Operation completed',
      context: 'TestService',
      level: 'info'
    });

    // Verify performance tracking
    logs.forEach(log => {
      expect(log.metadata).toHaveProperty('duration');
      expect(parseFloat(log.metadata.duration)).toBeGreaterThan(0);
    });
  });

  it('should handle and log errors properly', async () => {
    // Temporarily modify TestService to throw an error
    const module = app.select(TestModule);
    const testService = module.get(TestService);
    jest.spyOn(testService, 'performOperation').mockRejectedValueOnce(
      new Error('Test error')
    );

    await request(app.getHttpServer())
      .get('/test')
      .expect(500);

    const logs = fs.readFileSync(logPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line));

    // Find error log
    const errorLog = logs.find(log => log.level === 'error');
    expect(errorLog).toBeDefined();
    expect(errorLog.message).toContain('Test error');
    expect(errorLog.metadata).toHaveProperty('stack');
  });

  it('should mask sensitive data in logs', async () => {
    await request(app.getHttpServer())
      .get('/test')
      .set('Authorization', 'Bearer secret-token')
      .set('x-api-key', 'secret-api-key')
      .expect(200);

    const logs = fs.readFileSync(logPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line));

    logs.forEach(log => {
      // Check headers are masked
      if (log.metadata?.headers) {
        expect(log.metadata.headers.authorization).toBe('***');
        expect(log.metadata.headers['x-api-key']).toBe('***');
      }
    });
  });

  it('should maintain context across async operations', async () => {
    await request(app.getHttpServer())
      .get('/test')
      .set('x-correlation-id', 'test-correlation')
      .expect(200);

    const logs = fs.readFileSync(logPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line));

    // Verify correlation ID is maintained
    logs.forEach(log => {
      expect(log.correlationId).toBe('test-correlation');
    });

    // Verify chronological order and duration tracking
    let lastTimestamp = 0;
    logs.forEach(log => {
      const timestamp = new Date(log.timestamp).getTime();
      expect(timestamp).toBeGreaterThan(lastTimestamp);
      lastTimestamp = timestamp;
    });
  });
}); 
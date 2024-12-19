import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from './logger.service';
import { WinstonConfigService } from './winston-config.service';
import * as cls from 'cls-hooked';
import { LOGGING_NAMESPACE } from './constants';

describe('LoggerService', () => {
  let service: LoggerService;
  let namespace: cls.Namespace;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: WinstonConfigService,
          useValue: {
            getLogLevel: () => 'debug',
            getLogFormat: () => 'pretty',
            isLogAggregationEnabled: () => false,
          },
        },
      ],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
    namespace = cls.createNamespace(LOGGING_NAMESPACE);
  });

  afterEach(() => {
    cls.destroyNamespace(LOGGING_NAMESPACE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should mask sensitive data', () => {
    const logSpy = jest.spyOn(service['logger'], 'info');
    
    namespace.run(() => {
      service.log('Test message', 'TEST', { 
        apiKey: 'secret-key',
        password: '12345',
        normalData: 'visible'
      });
    });

    expect(logSpy).toHaveBeenCalledWith(
      'Test message',
      expect.objectContaining({
        metadata: expect.objectContaining({
          apiKey: '***',
          password: '***',
          normalData: 'visible'
        })
      })
    );
  });

  it('should include request context', () => {
    const logSpy = jest.spyOn(service['logger'], 'info');
    const requestId = 'test-request-id';
    const userId = 'test-user-id';

    namespace.run(() => {
      namespace.set('requestId', requestId);
      namespace.set('userId', userId);
      service.log('Test message');
    });

    expect(logSpy).toHaveBeenCalledWith(
      'Test message',
      expect.objectContaining({
        requestId,
        userId
      })
    );
  });

  it('should track performance metrics', () => {
    const logSpy = jest.spyOn(service['logger'], 'info');
    
    namespace.run(() => {
      namespace.set('startTime', performance.now());
      service.log('Test message');
    });

    expect(logSpy).toHaveBeenCalledWith(
      'Test message',
      expect.objectContaining({
        metadata: expect.objectContaining({
          duration: expect.stringMatching(/\d+ms/)
        })
      })
    );
  });
}); 
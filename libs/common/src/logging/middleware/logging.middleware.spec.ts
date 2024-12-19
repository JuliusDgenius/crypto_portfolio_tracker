import { Test, TestingModule } from '@nestjs/testing';
import { LoggingMiddleware } from './logging.middleware';
import { Request, Response } from 'express';
import * as cls from 'cls-hooked';
import { LOGGING_NAMESPACE } from '../constants';

describe('LoggingMiddleware', () => {
  let middleware: LoggingMiddleware;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingMiddleware],
    }).compile();

    middleware = module.get<LoggingMiddleware>(LoggingMiddleware);
  });

  afterEach(() => {
    cls.destroyNamespace(LOGGING_NAMESPACE);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should create request context with generated IDs', () => {
    const req = {
      headers: {},
      user: { id: 'test-user' },
      get: jest.fn(),
      header: jest.fn(),
      accepts: jest.fn(),
      acceptsCharsets: jest.fn(),
      acceptsEncodings: jest.fn(),
      acceptsLanguages: jest.fn(),
    } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn();

    middleware.use(req, res, next);

    const namespace = cls.getNamespace(LOGGING_NAMESPACE);
    expect(namespace).toBeDefined();

    namespace?.run(() => {
      expect(namespace?.get('requestId')).toMatch(/^[0-9a-f-]{36}$/);
      expect(namespace?.get('correlationId')).toMatch(/^[0-9a-f-]{36}$/);
      expect(namespace?.get('userId')).toBe('test-user');
      expect(namespace?.get('startTime')).toBeDefined();
    });

    expect(next).toHaveBeenCalled();
  });

  it('should use existing request and correlation IDs', () => {
    const requestId = 'existing-request-id';
    const correlationId = 'existing-correlation-id';
    
    const req = {
      headers: {
        'x-request-id': requestId,
        'x-correlation-id': correlationId
      },
      user: { id: 'test-user' },
      get: jest.fn(),
      header: jest.fn(),
      accepts: jest.fn(),
      acceptsCharsets: jest.fn(),
      acceptsEncodings: jest.fn(),
      acceptsLanguages: jest.fn(),
    } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn();

    middleware.use(req, res, next);

    const namespace = cls.getNamespace(LOGGING_NAMESPACE);
    namespace?.run(() => {
      expect(namespace?.get('requestId')).toBe(requestId);
      expect(namespace?.get('correlationId')).toBe(correlationId);
    });
  });
}); 
import { BaseException } from './base.exception';

describe('BaseException', () => {
  it('should create exception with default status code', () => {
    const exception = new BaseException('Test error', 'TEST_ERROR');

    expect(exception.message).toBe('Test error');
    expect(exception.code).toBe('TEST_ERROR');
    expect(exception.status).toBe(500);
    expect(exception.name).toBe('BaseException');
  });

  it('should create exception with custom status code', () => {
    const exception = new BaseException('Not found', 'NOT_FOUND', 404);

    expect(exception.message).toBe('Not found');
    expect(exception.code).toBe('NOT_FOUND');
    expect(exception.status).toBe(404);
  });

  it('should be instanceof Error', () => {
    const exception = new BaseException('Test error', 'TEST_ERROR');
    expect(exception).toBeInstanceOf(Error);
  });
}); 
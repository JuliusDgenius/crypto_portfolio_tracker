import { Test } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from './throttler.guard';
import { ThrottlerException, ThrottlerGuard as NestThrottlerGuard } from '@nestjs/throttler';

// Create a test class to access protected method
class TestThrottlerGuard extends ThrottlerGuard {
  public async testGetTracker(req: Record<string, any>): Promise<string> {
    return this.getTracker(req);
  }
}

describe('ThrottlerGuard', () => {
  let guard: TestThrottlerGuard;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TestThrottlerGuard],
    }).compile();

    guard = module.get<TestThrottlerGuard>(TestThrottlerGuard);
    
    // Mock the parent class's canActivate method
    jest.spyOn(NestThrottlerGuard.prototype, 'canActivate')
      .mockImplementation(() => Promise.resolve(true));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('instance', () => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should extend NestThrottlerGuard', () => {
      expect(guard).toBeInstanceOf(NestThrottlerGuard);
    });
  });

  describe('canActivate', () => {
    it('should skip throttling for authenticated users', async () => {
      const context = createMockExecutionContext(true);
      expect(await guard.canActivate(context)).toBe(true);
    });

    it('should apply throttling for unauthenticated users', async () => {
      const context = createMockExecutionContext(false);
      const superCanActivate = jest.spyOn(NestThrottlerGuard.prototype, 'canActivate');
      
      await guard.canActivate(context);
      expect(superCanActivate).toHaveBeenCalledWith(context);
    });

    it('should throw when rate limit exceeded', async () => {
      const context = createMockExecutionContext(false);
      jest.spyOn(NestThrottlerGuard.prototype, 'canActivate')
        .mockRejectedValue(new ThrottlerException());
      
      await expect(guard.canActivate(context))
        .rejects.toThrow(ThrottlerException);
    });
  });

  describe('getTracker', () => {
    it('should use first IP from X-Forwarded-For', async () => {
      const req = { 
        ips: ['1.1.1.1', '2.2.2.2'], 
        ip: '3.3.3.3',
        headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }
      };
      expect(await guard.testGetTracker(req)).toBe('1.1.1.1');
    });

    it('should fallback to request IP when no forwarded IPs', async () => {
      const req = { 
        ips: [], 
        ip: '3.3.3.3',
        headers: {}
      };
      expect(await guard.testGetTracker(req)).toBe('3.3.3.3');
    });

    it('should handle missing IPs array', async () => {
      const req = { 
        ip: '3.3.3.3',
        headers: {}
      };
      expect(await guard.testGetTracker(req)).toBe('3.3.3.3');
    });

    it('should handle completely missing IP information', async () => {
      const req = { headers: {} };
      await expect(guard.testGetTracker(req))
        .rejects.toThrow('No IP address found');
    });

    it('should handle invalid IP formats', async () => {
      const req = { 
        ips: ['invalid.ip'], 
        ip: 'also.invalid',
        headers: {}
      };
      await expect(guard.testGetTracker(req))
        .rejects.toThrow('Invalid IP address format');
    });

    it('should handle IPv6 addresses', async () => {
      const req = { 
        ips: ['2001:db8::1'], 
        ip: '::1',
        headers: {}
      };
      expect(await guard.testGetTracker(req)).toBe('2001:db8::1');
    });
  });
});

function createMockExecutionContext(authenticated: boolean): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: authenticated ? { id: 1 } : null,
        ips: ['1.1.1.1'],
        ip: '2.2.2.2',
        headers: {
          'x-forwarded-for': '1.1.1.1'
        }
      }),
    }),
  } as ExecutionContext;
} 
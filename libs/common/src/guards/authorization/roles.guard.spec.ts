import { Test } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('instance', () => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
    });
  });

  describe('canActivate', () => {
    it('should allow when no roles required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
      const context = createMockExecutionContext({});
      
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow user with exact required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      const context = createMockExecutionContext({ roles: ['admin'] });
      
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow user with one of multiple required roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'moderator']);
      const context = createMockExecutionContext({ roles: ['moderator'] });
      
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny user without required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      const context = createMockExecutionContext({ roles: ['user'] });
      
      expect(guard.canActivate(context)).toBe(false);
    });

    it('should deny when user has no roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      const context = createMockExecutionContext({ roles: [] });
      
      expect(guard.canActivate(context)).toBe(false);
    });

    it('should deny when user roles is undefined', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      const context = createMockExecutionContext({});
      
      expect(guard.canActivate(context)).toBe(false);
    });

    it('should use correct metadata key', () => {
      jest.spyOn(reflector, 'getAllAndOverride');
      const context = createMockExecutionContext({});
      
      guard.canActivate(context);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        expect.any(Object),
        expect.any(Object),
      ]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty required roles array', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
      const context = createMockExecutionContext({ roles: ['user'] });
      
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should handle case-sensitive role comparison', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Admin']);
      const context = createMockExecutionContext({ roles: ['admin'] });
      
      expect(guard.canActivate(context)).toBe(false);
    });

    it('should handle missing user object', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      const context = createMockExecutionContext(null);
      
      expect(guard.canActivate(context)).toBe(false);
    });
  });
});

function createMockExecutionContext(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user,
      }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;
} 
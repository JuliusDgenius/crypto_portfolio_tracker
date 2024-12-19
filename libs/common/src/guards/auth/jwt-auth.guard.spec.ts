import { Test } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow public routes', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const context = createMockExecutionContext();
      
      expect(await guard.canActivate(context)).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        [expect.any(Object), expect.any(Object)]
      );
    });

    it('should call super.canActivate for protected routes', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const context = createMockExecutionContext();
      const superCanActivate = jest.spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockImplementation(() => Promise.resolve(true));
      
      await guard.canActivate(context);
      expect(superCanActivate).toHaveBeenCalledWith(context);
    });
  });

  describe('handleRequest', () => {
    it('should throw UnauthorizedException when error occurs', () => {
      expect(() => guard.handleRequest(new Error(), null))
        .toThrow(new UnauthorizedException('Invalid token or token expired'));
    });

    it('should throw UnauthorizedException when no user', () => {
      expect(() => guard.handleRequest(null, null))
        .toThrow(new UnauthorizedException('Invalid token or token expired'));
    });

    it('should return user when valid', () => {
      const user = { id: 1, email: 'test@example.com' };
      expect(guard.handleRequest(null, user)).toBe(user);
    });
  });
});

function createMockExecutionContext(): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: null,
      }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;
} 
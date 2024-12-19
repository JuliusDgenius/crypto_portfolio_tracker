import { Test } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { RefreshTokenGuard } from './refresh-token.guard';
import { AuthGuard } from '@nestjs/passport';

describe('RefreshTokenGuard', () => {
  let guard: RefreshTokenGuard;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RefreshTokenGuard],
    }).compile();

    guard = module.get<RefreshTokenGuard>(RefreshTokenGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should call super.canActivate', async () => {
      const context = createMockExecutionContext();
      const superCanActivate = jest.spyOn(AuthGuard('jwt-refresh').prototype, 'canActivate')
        .mockImplementation(() => Promise.resolve(true));
      
      await guard.canActivate(context);
      expect(superCanActivate).toHaveBeenCalledWith(context);
    });
  });

  describe('handleRequest', () => {
    it('should throw UnauthorizedException when error occurs', () => {
      expect(() => guard.handleRequest(new Error(), null, null))
        .toThrow(new UnauthorizedException('Invalid refresh token'));
    });

    it('should throw UnauthorizedException when no user', () => {
      expect(() => guard.handleRequest(null, null, null))
        .toThrow(new UnauthorizedException('Invalid refresh token'));
    });

    it('should return user when valid', () => {
      const user = { id: 1, email: 'test@example.com' };
      expect(guard.handleRequest(null, user, null)).toBe(user);
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
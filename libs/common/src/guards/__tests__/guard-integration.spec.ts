import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ThrottlerException } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../authorization/roles.guard';
import { ThrottlerGuard } from '../security/throttler.guard';
import { WebSocketGuard } from '../security/websocket.guard';
import { Reflector } from '@nestjs/core';
import { sign } from 'jsonwebtoken';

describe('Guard Integration Tests', () => {
  let module: TestingModule;
  let jwtGuard: JwtAuthGuard;
  let rolesGuard: RolesGuard;
  let throttlerGuard: ThrottlerGuard;
  let wsGuard: WebSocketGuard;
  let reflector: Reflector;

  const JWT_SECRET = 'test-secret';

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    
    module = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        RolesGuard,
        ThrottlerGuard,
        WebSocketGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    jwtGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
    rolesGuard = module.get<RolesGuard>(RolesGuard);
    throttlerGuard = module.get<ThrottlerGuard>(ThrottlerGuard);
    wsGuard = module.get<WebSocketGuard>(WebSocketGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('HTTP Request Flow', () => {
    it('should handle complete authenticated flow with roles', async () => {
      // Setup
      const userData = { sub: '123', roles: ['admin'] };
      const token = sign(userData, JWT_SECRET);
      const context = createHttpContext(token);
      
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(false)  // for JwtAuthGuard
        .mockReturnValueOnce(['admin']); // for RolesGuard

      // Execute
      await expect(jwtGuard.canActivate(context)).resolves.toBeTruthy();
      await expect(rolesGuard.canActivate(context)).resolves.toBeTruthy();
    });

    it('should handle rate limiting for authenticated users', async () => {
      // Setup
      const userData = { sub: '123', roles: ['user'] };
      const token = sign(userData, JWT_SECRET);
      const context = createHttpContext(token);

      // Execute
      await expect(jwtGuard.canActivate(context)).resolves.toBeTruthy();
      await expect(throttlerGuard.canActivate(context)).resolves.toBeTruthy();
    });

    it('should reject unauthorized access with proper error chain', async () => {
      const context = createHttpContext('invalid-token');
      
      await expect(jwtGuard.canActivate(context))
        .rejects.toThrow(UnauthorizedException);
      
      // Should not reach roles check
      await expect(rolesGuard.canActivate(context))
        .resolves.toBeFalsy();
    });
  });

  describe('WebSocket Flow', () => {
    it('should handle authenticated WebSocket connection with roles', async () => {
      // Setup
      const userData = { sub: '123', roles: ['user'] };
      const token = sign(userData, JWT_SECRET);
      const { context, client } = createWsContext({ token });

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['user']);

      // Execute
      await expect(wsGuard.canActivate(context)).resolves.toBeTruthy();
      await expect(rolesGuard.canActivate(context)).resolves.toBeTruthy();
      expect(client.user).toMatchObject(userData);
    });

    it('should handle rate limiting for WebSocket connections', async () => {
      const { context } = createWsContext({ token: sign({ sub: '123' }, JWT_SECRET) });
      
      await expect(wsGuard.canActivate(context)).resolves.toBeTruthy();
      await expect(throttlerGuard.canActivate(context)).resolves.toBeTruthy();
    });
  });

  describe('Error Handling Integration', () => {
    it('should properly chain authentication errors', async () => {
      const context = createHttpContext('invalid-token');
      
      try {
        await jwtGuard.canActivate(context);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid token or token expired');
      }
    });

    it('should handle rate limiting errors across protocols', async () => {
      jest.spyOn(throttlerGuard, 'canActivate')
        .mockRejectedValue(new ThrottlerException());

      const httpContext = createHttpContext(sign({ sub: '123' }, JWT_SECRET));
      const { context: wsContext } = createWsContext({ 
        token: sign({ sub: '123' }, JWT_SECRET) 
      });

      await expect(throttlerGuard.canActivate(httpContext))
        .rejects.toThrow(ThrottlerException);
      await expect(throttlerGuard.canActivate(wsContext))
        .rejects.toThrow(ThrottlerException);
    });
  });

  describe('Cross-Protocol Security', () => {
    it('should maintain consistent authentication state', async () => {
      const userData = { sub: '123', roles: ['user'] };
      const token = sign(userData, JWT_SECRET);

      const httpContext = createHttpContext(token);
      const { context: wsContext, client } = createWsContext({ token });

      await jwtGuard.canActivate(httpContext);
      await wsGuard.canActivate(wsContext);

      const httpUser = httpContext.switchToHttp().getRequest().user;
      expect(httpUser).toMatchObject(userData);
      expect(client.user).toMatchObject(userData);
    });

    it('should maintain role consistency across protocols', async () => {
      const userData = { sub: '123', roles: ['trader'] };
      const token = sign(userData, JWT_SECRET);
      const httpContext = createHttpContext(token);
      const { context: wsContext, client } = createWsContext({ token });

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['trader']);

      await jwtGuard.canActivate(httpContext);
      await wsGuard.canActivate(wsContext);
      await rolesGuard.canActivate(httpContext);
      await rolesGuard.canActivate(wsContext);

      expect(httpContext.switchToHttp().getRequest().user.roles).toContain('trader');
      expect(client.user.roles).toContain('trader');
    });

    it('should handle rate limiting across simultaneous connections', async () => {
      const userData = { sub: '123' };
      const token = sign(userData, JWT_SECRET);
      
      const httpContext1 = createHttpContext(token);
      const httpContext2 = createHttpContext(token);
      const { context: wsContext1 } = createWsContext({ token });
      const { context: wsContext2 } = createWsContext({ token });

      await Promise.all([
        throttlerGuard.canActivate(httpContext1),
        throttlerGuard.canActivate(httpContext2),
        throttlerGuard.canActivate(wsContext1),
        throttlerGuard.canActivate(wsContext2)
      ]);
    });

    it('should handle concurrent authentication attempts', async () => {
      const userData = { sub: '123', roles: ['user'] };
      const token = sign(userData, JWT_SECRET);
      
      const contexts = Array(5).fill(null).map(() => ({
        http: createHttpContext(token),
        ws: createWsContext({ token }).context
      }));

      await Promise.all(contexts.flatMap(({ http, ws }) => [
        jwtGuard.canActivate(http),
        wsGuard.canActivate(ws)
      ]));
    });

    it('should maintain session consistency during protocol switching', async () => {
      const userData = { 
        sub: '123', 
        roles: ['user'],
        session: 'test-session'
      };
      const token = sign(userData, JWT_SECRET);
      
      const httpContext = createHttpContext(token);
      const { context: wsContext, client } = createWsContext({ token });

      // Simulate HTTP -> WS -> HTTP flow
      await jwtGuard.canActivate(httpContext);
      await wsGuard.canActivate(wsContext);
      await jwtGuard.canActivate(httpContext);

      expect(httpContext.switchToHttp().getRequest().user.session)
        .toBe(client.user.session);
    });

    it('should handle reconnection scenarios', async () => {
      const userData = { sub: '123', roles: ['user'] };
      const token = sign(userData, JWT_SECRET);
      
      // Initial connection
      const { context: wsContext1, client: client1 } = createWsContext({ token });
      await wsGuard.canActivate(wsContext1);
      
      // Simulate reconnection
      const { context: wsContext2, client: client2 } = createWsContext({ token });
      await wsGuard.canActivate(wsContext2);

      expect(client1.user).toMatchObject(userData);
      expect(client2.user).toMatchObject(userData);
    });
  });

  describe('Protocol-Specific Error Handling', () => {
    it('should handle WebSocket disconnection during authentication', async () => {
      const token = sign({ sub: '123' }, JWT_SECRET);
      const { context, client } = createWsContext({ token });
      
      // Simulate disconnection
      client.disconnect = jest.fn();
      
      await wsGuard.canActivate(context);
      expect(client.disconnect).not.toHaveBeenCalled();
      
      // Simulate invalid token after connected
      client.handshake.auth.token = 'invalid';
      await expect(wsGuard.canActivate(context))
        .rejects.toThrow(WsException);
    });
  });
});

function createHttpContext(token: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization: `Bearer ${token}` },
        user: null,
      }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;
}

interface WsClient {
  handshake: { auth: { token?: string } };
  user?: any;
  disconnect?: () => void;
}

function createWsContext(auth: { token?: string }) {
  const client: WsClient = {
    handshake: { auth },
  };

  const context = {
    switchToWs: () => ({
      getClient: () => client,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;

  return { context, client };
} 
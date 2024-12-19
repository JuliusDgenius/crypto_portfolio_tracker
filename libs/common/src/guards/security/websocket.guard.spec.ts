import { Test } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { WebSocketGuard } from './websocket.guard';
import { sign } from 'jsonwebtoken';

interface WsClient {
  handshake: {
    auth: {
      token?: string;
    };
  };
  user?: any;
}

describe('WebSocketGuard', () => {
  let guard: WebSocketGuard;
  const JWT_SECRET = 'test-secret';

  beforeEach(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    const module = await Test.createTestingModule({
      providers: [WebSocketGuard],
    }).compile();

    guard = module.get<WebSocketGuard>(WebSocketGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.JWT_SECRET;
  });

  describe('instance', () => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
    });
  });

  describe('canActivate', () => {
    it('should throw when no token provided', async () => {
      const { context } = createMockExecutionContext({});
      await expect(guard.canActivate(context)).rejects.toThrow(
        new WsException('Authentication token not found')
      );
    });

    it('should throw when JWT_SECRET not configured', async () => {
      delete process.env.JWT_SECRET;
      const token = sign({ sub: '123' }, JWT_SECRET);
      const { context } = createMockExecutionContext({ token });
      
      await expect(guard.canActivate(context)).rejects.toThrow(
        new WsException('JWT_SECRET not configured')
      );
    });

    it('should throw when token is invalid', async () => {
      const { context } = createMockExecutionContext({ token: 'invalid-token' });
      await expect(guard.canActivate(context)).rejects.toThrow(
        new WsException('Invalid token')
      );
    });

    it('should allow valid token', async () => {
      const token = sign({ sub: '123' }, JWT_SECRET);
      const { context } = createMockExecutionContext({ token });
      
      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('should handle malformed token', async () => {
      const { context } = createMockExecutionContext({ token: 'malformed.token.here' });
      await expect(guard.canActivate(context)).rejects.toThrow(
        new WsException('Invalid token')
      );
    });
  });

  describe('user attachment', () => {
    it('should attach user data to client', async () => {
      const userData = { sub: '123', email: 'test@example.com', roles: ['user'] };
      const token = sign(userData, JWT_SECRET);
      const { context, client } = createMockExecutionContext({ token });
      
      await guard.canActivate(context);
      expect(client.user).toMatchObject(userData);
    });

    it('should handle complex user objects', async () => {
      const userData = {
        sub: '123',
        profile: { name: 'Test User', age: 25 },
        permissions: ['read', 'write']
      };
      const token = sign(userData, JWT_SECRET);
      const { context, client } = createMockExecutionContext({ token });
      
      await guard.canActivate(context);
      expect(client.user).toMatchObject(userData);
    });
  });
});

function createMockExecutionContext(auth: { token?: string }) {
  const client: WsClient = {
    handshake: {
      auth,
    },
  };

  const context = {
    switchToWs: () => ({
      getClient: () => client,
    }),
  } as ExecutionContext;

  return { context, client };
} 
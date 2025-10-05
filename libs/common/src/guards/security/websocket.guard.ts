import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { verify } from 'jsonwebtoken';

@Injectable()
export class WebSocketGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const type = context.getType<'ws' | 'http'>();

    // Handle Websocket
    if (type == 'ws') {
      const client = context.switchToWs().getClient();
      const token = client.handshake?.auth?.token;

      if (!token) {
        throw new WsException('Authentication token not found');
      }
      const decoded = verify(token, process.env.JWT_SECRET!);
      client.user = decoded;
      return true;
    }
    
    // Handle HTTP/SSE auth
    if (type === 'http') {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers['authorization'];

      if (!authHeader) return false;
      const token = authHeader.split(' ')[1];

      try {
        const decoded = verify(token, process.env.JWT_SECRET!);
        request.user = decoded;
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }
} 
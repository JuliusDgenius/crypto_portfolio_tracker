import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { verify } from 'jsonwebtoken';

@Injectable()
export class WebSocketGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const token = client.handshake?.auth?.token;

    if (!token) {
      throw new WsException('Authentication token not found');
    }

    try {
      if (!process.env.JWT_SECRET) {
        throw new WsException('JWT_SECRET not configured');
      }
      const decoded = verify(token, process.env.JWT_SECRET);
      client.user = decoded;
      return true;
    } catch (err) {
      throw new WsException('Invalid token');
    }
  }
} 
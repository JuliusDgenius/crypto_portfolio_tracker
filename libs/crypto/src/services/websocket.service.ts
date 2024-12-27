import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { WebSocket } from 'ws';
import { Subject } from 'rxjs';
import { Logger } from '@nestjs/common';

@Injectable()
export class WebSocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebSocketService.name);
  private ws: WebSocket;
  private readonly priceUpdates = new Subject<any>();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 5000;

  public priceUpdates$ = this.priceUpdates.asObservable();

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    this.cleanup();
  }

  private connect() {
    this.ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');

    this.ws.on('open', () => {
      this.logger.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.ws.on('message', (data: string) => {
      try {
        const parsedData = JSON.parse(data);
        this.priceUpdates.next(parsedData);
      } catch (error) {
        this.logger.error(`Error parsing WebSocket message: ${error.message}`);
      }
    });

    this.ws.on('close', () => {
      this.logger.warn('WebSocket disconnected');
      this.attemptReconnect();
    });

    this.ws.on('error', (error) => {
      this.logger.error(`WebSocket error: ${error.message}`);
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      this.logger.error('Max reconnection attempts reached');
    }
  }

  private cleanup() {
    if (this.ws) {
      this.ws.close();
    }
    this.priceUpdates.complete();
  }
}
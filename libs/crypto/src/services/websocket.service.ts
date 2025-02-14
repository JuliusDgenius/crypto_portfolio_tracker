import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { WebSocket } from 'ws';
import { Subject, BehaviorSubject } from 'rxjs';
import { Logger } from '@nestjs/common';

// Define clear types for our WebSocket messages
interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: number;
}

// Connection states for better status management
enum ConnectionState {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  ERROR = 'ERROR',
}

@Injectable()
export class WebSocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebSocketService.name);
  private ws: WebSocket;
  
  // Use BehaviorSubject for connection state to always have a current value
  private readonly connectionState = new BehaviorSubject<ConnectionState>(ConnectionState.DISCONNECTED);
  private readonly priceUpdates = new Subject<PriceUpdate>();
  
  // Configuration parameters
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 5000; // 5 seconds
  private readonly pingInterval = 30000;   // 30 seconds
  private pingTimeout: NodeJS.Timeout;
  
  // Public observables for subscribers
  public priceUpdates$ = this.priceUpdates.asObservable();
  public connectionState$ = this.connectionState.asObservable();

  onModuleInit() {
    this.initializeConnection();
  }

  onModuleDestroy() {
    this.cleanup();
  }

  private initializeConnection() {
    this.connectionState.next(ConnectionState.CONNECTING);
    this.connect();
    this.setupPingInterval();
  }

  private connect() {
    try {
      this.ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
      this.setupEventHandlers();
    } catch (error) {
      this.logger.error(`Failed to create WebSocket connection: ${error.message}`);
      this.handleConnectionError();
    }
  }

  private setupEventHandlers() {
    // Connection established
    this.ws.on('open', () => {
      this.logger.log('WebSocket connected successfully');
      this.connectionState.next(ConnectionState.CONNECTED);
      this.reconnectAttempts = 0;
      this.subscribeToPriceUpdates();
    });

    // Receiving messages
    this.ws.on('message', (data: string) => {
      try {
        const parsedData = JSON.parse(data);
        // Transform raw data into our PriceUpdate interface
        if (Array.isArray(parsedData)) {
          const priceUpdates = this.transformPriceData(parsedData);
          priceUpdates.forEach(update => this.priceUpdates.next(update));
        } else {
          this.logger.warn('Received data is not an array');
        }
        
      } catch (error) {
        this.logger.error(`Error processing WebSocket message: ${error.message}`);
      }
    });

    // Connection closed
    this.ws.on('close', (code: number, reason: string) => {
      this.logger.warn(`WebSocket disconnected: ${code} - ${reason}`);
      this.connectionState.next(ConnectionState.DISCONNECTED);
      this.handleDisconnection();
    });

    // Error handling
    this.ws.on('error', (error) => {
      this.logger.error(`WebSocket error occurred: ${error.message}`);
      this.connectionState.next(ConnectionState.ERROR);
      this.handleConnectionError();
    });

    // Pong response handler
    this.ws.on('pong', () => {
      this.logger.debug('Received pong response');
    });
  }

  private subscribeToPriceUpdates() {
    const subscribeMessage = {
      method: 'SUBSCRIBE',
      params: ['!ticker@arr'],
      id: 1
    };
    this.ws.send(JSON.stringify(subscribeMessage));
  }

  private transformPriceData(rawData: any[]): PriceUpdate[] {
    return rawData.map(item => ({
      symbol: item.s,
      price: parseFloat(item.c),
      timestamp: item.E
    }));
  }

  private handleDisconnection() {
    this.clearPingInterval();
    if (this.shouldAttemptReconnect()) {
      this.attemptReconnect();
    } else {
      this.logger.error('Maximum reconnection attempts reached');
    }
  }

  private handleConnectionError() {
    this.connectionState.next(ConnectionState.ERROR);
    this.handleDisconnection();
  }

  private shouldAttemptReconnect(): boolean {
    return this.reconnectAttempts < this.maxReconnectAttempts;
  }

  private attemptReconnect() {
    this.reconnectAttempts++;
    const delay = this.calculateReconnectDelay();
    
    this.logger.log(`Attempting to reconnect (
      ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`
    );
    
    setTimeout(() => this.initializeConnection(), delay);
  }

  private calculateReconnectDelay(): number {
    // Exponential backoff with jitter
    const baseDelay = this.reconnectDelay;
    const exponentialDelay = baseDelay * Math.pow(2, this.reconnectAttempts - 1);
    const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  private setupPingInterval() {
    this.pingTimeout = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, this.pingInterval);
  }

  private clearPingInterval() {
    if (this.pingTimeout) {
      clearInterval(this.pingTimeout);
    }
  }

  private cleanup() {
    this.clearPingInterval();
    
    if (this.ws) {
      // Attempt graceful closure
      try {
        this.ws.close(1000, 'Service shutdown');
      } catch (error) {
        this.logger.error(`Error during WebSocket cleanup: ${error.message}`);
      }
    }
    
    // Complete all subjects
    this.priceUpdates.complete();
    this.connectionState.complete();
  }

  // Public method to manually reconnect if needed
  public reconnect() {
    this.logger.log('Manual reconnection requested');
    this.cleanup();
    this.reconnectAttempts = 0;
    this.initializeConnection();
  }
}
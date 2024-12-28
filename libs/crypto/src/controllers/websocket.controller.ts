// controllers/websocket.controller.ts
import { Controller, Sse, MessageEvent, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WebSocketService } from '../services/websocket.service';
import { WebSocketGuard } from '../../../common/src';

@ApiTags('Real-time Price Updates')
@UseGuards(WebSocketGuard)
@Controller('stream')
export class WebSocketController {
  constructor(private readonly webSocketService: WebSocketService) {}

  @Sse('prices')
  @ApiOperation({ summary: 'Get real-time price updates via Server-Sent Events (SSE)' })
  @ApiResponse({ status: 200, description: 'SSE connection established successfully' })
  streamPrices(): Observable<MessageEvent> {
    return this.webSocketService.priceUpdates$.pipe(
      map(data => ({
        data,
        id: Date.now().toString(),
        type: 'price-update',
        retry: 15000
      }))
    );
  }
}
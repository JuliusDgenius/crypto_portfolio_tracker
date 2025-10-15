import { 
  Controller, 
  Sse, 
  MessageEvent, 
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { WebSocketService } from '../services/websocket.service';
import { WebSocketGuard } from '../../../common/src';

@ApiTags('Real-time Price Updates')
@UseGuards(WebSocketGuard)
@ApiSecurity('JWT-auth')
@Controller('stream')
export class WebSocketController {
  private readonly logger = new Logger(WebSocketController.name);

  constructor(
    private readonly webSocketService: WebSocketService
  ) {}

  @Sse('prices')
  @ApiOperation({
    summary: 'Get real-time price updates via Server-Sent Events (SSE)' 
  })
  @ApiResponse({ 
    status: 200, description: 'SSE connection established successfully' 
  })
  streamPrices(): Observable<MessageEvent> {
    this.logger.debug('Price stream server sent event endpoint hit...');
    
    return this.webSocketService.priceUpdates$.pipe(
      tap(data => {
        this.logger.log('--- Raw Price Update Emitted ---');
	      this.logger.log(JSON.stringify(data.slice(0, 6)));
        this.logger.log('--------------------------------');
      }),

      map(data => ({
        data: JSON.stringify(data), // Properly serialize the data for SSE
        id: Date.now().toString(),
        type: 'price-update',
        retry: 15000
      })),

      tap(transformedData => {
        this.logger.log('--- SSE MessageEvent (After Map) ---');
        this.logger.log(JSON.stringify((transformedData.data as any[]).slice(0, 6)));
        this.logger.log('------------------------------------');
      })
    );
  }
}

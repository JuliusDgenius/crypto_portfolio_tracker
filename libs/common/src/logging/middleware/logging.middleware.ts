import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as cls from 'cls-hooked';
import { v4 as uuidv4 } from 'uuid';
import { LOGGING_NAMESPACE } from '../constants';
import { performance } from 'perf_hooks';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const namespace = cls.getNamespace(LOGGING_NAMESPACE) || cls.createNamespace(LOGGING_NAMESPACE);

    namespace.run(() => {
      namespace.set('requestId', req.headers['x-request-id'] || uuidv4());
      namespace.set('correlationId', req.headers['x-correlation-id'] || uuidv4());
      namespace.set('startTime', performance.now());
      namespace.set('userId', (req as any).user?.id);

      next();
    });
  }
} 
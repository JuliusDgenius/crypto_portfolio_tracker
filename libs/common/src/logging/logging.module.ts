import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { WinstonConfigService } from './winston-config.service';

@Global()
@Module({
  providers: [LoggerService, WinstonConfigService],
  exports: [LoggerService],
})
export class LoggingModule {} 
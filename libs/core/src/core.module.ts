import { Module } from '@nestjs/common';
import { CoreService } from './core.service';

/**
 * Core module providing fundamental functionality
 * @module CoreModule
 */
@Module({
  providers: [CoreService],
  exports: [CoreService],
})
export class CoreModule {}

import { Module } from '@nestjs/common';
import { PrismaService } from '../../../libs/database/src';
import { DatabaseHealthIndicator } from '../../../libs/database/src';

@Module({
  providers: [
    {
      provide: PrismaService,
      useValue: {
        $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]),
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      },
    },
    {
      provide: DatabaseHealthIndicator,
      useValue: {
        isHealthy: jest.fn().mockResolvedValue({
          database: {
            status: 'up'
          }
        })
      }
    }
  ],
  exports: [PrismaService, DatabaseHealthIndicator],
})
export class DatabaseTestModule {} 
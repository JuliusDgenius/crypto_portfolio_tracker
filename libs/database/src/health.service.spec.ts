import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseHealthIndicator } from './health.service';
import { PrismaService } from './prisma.service';
import { HealthCheckError } from '@nestjs/terminus';

describe('DatabaseHealthIndicator', () => {
  let healthIndicator: DatabaseHealthIndicator;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseHealthIndicator,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
      ],
    }).compile();

    healthIndicator = module.get<DatabaseHealthIndicator>(DatabaseHealthIndicator);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be healthy when database query succeeds', async () => {
    jest.spyOn(prismaService, '$queryRaw').mockResolvedValueOnce([]);
    
    const result = await healthIndicator.isHealthy('database');
    
    expect(result).toEqual({
      database: {
        status: 'up',
      },
    });
  });

  it('should be unhealthy when database query fails', async () => {
    jest.spyOn(prismaService, '$queryRaw').mockRejectedValueOnce(new Error());
    
    await expect(healthIndicator.isHealthy('database')).rejects.toThrow(HealthCheckError);
  });
}); 
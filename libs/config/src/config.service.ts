import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get port(): number {
    const port = this.configService.get<number>('PORT');
    if (!port) throw new Error('PORT is not defined');
    return port;
  }

  get databaseUrl(): string {
    const url = this.configService.get<string>('DATABASE_URL');
    if (!url) throw new Error('DATABASE_URL is not defined');
    return url;
  }

  get apiKey(): string | undefined {
    return this.configService.get<string>('API_KEY');
  }

  get<T>(key: string): T {
    const value = this.configService.get<T>(key);
    
    if (value === undefined) {
      throw new Error(`Configuration key "${key}" is undefined`);
    }
    
    return value;
  }
} 
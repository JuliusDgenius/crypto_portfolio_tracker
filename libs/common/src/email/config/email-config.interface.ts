import { Logger } from "@nestjs/common";

export interface EmailConfig {
  enabled: boolean;
  development: boolean;
  baseUrl?: string;
  supportEmail?: string;
  debug?: boolean;
  logger: Logger
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  defaults: {
    from: string;
    replyTo: string;
  };
  queue: {
    enabled: boolean;
    prefix: string;
    defaultJobOptions: {
      attempts: number;
      backoff: {
        type: string;
        delay: number;
      };
    };
  };
  rateLimiting: {
    points: number;
    duration: number;
  };
  templates: {
    directory: string;
    caching: boolean;
  };
}

export interface MockEmailConfig {
        host: string,
        port: number,
        secure: false,
        mock: boolean,
        auth: {
          user: string,
          pass: string,
        },
}
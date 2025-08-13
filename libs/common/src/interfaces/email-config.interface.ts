export interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    debug?: boolean;
    logger?: boolean;
    mock?: boolean;
    baseUrl: string;
    apiBaseUrl?: string;
    supportEmail: string;
    emailEnabled?: boolean
  }
  
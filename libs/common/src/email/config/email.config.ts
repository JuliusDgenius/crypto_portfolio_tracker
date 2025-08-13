import { registerAs } from '@nestjs/config';
import { EmailConfig } from '../../interfaces';

export default registerAs('email', (): EmailConfig => ({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT, 10) || 587,
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
  debug: process.env.MAIL_DEBUG === 'true',
  logger: process.env.MAIL_LOGGER === 'true',
  mock: process.env.MAIL_MOCK === 'true',
  baseUrl: process.env.MAIL_BASE_URL,
  apiBaseUrl: process.env.MAIL_API_BASE_URL,
  supportEmail: process.env.MAIL_SUPPORT_EMAIL,
  emailEnabled: process.env.EMAIL_ENABLED === 'true'
}));
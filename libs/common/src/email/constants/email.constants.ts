// libs/common/src/email/constants/email.constants.ts
export const EMAIL_QUEUE = 'email';

export enum EmailPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4,
}

export enum EmailTemplate {
  WELCOME = 'welcome',
  VERIFICATION = 'verification',
  PASSWORD_RESET = 'password-reset',
}

export const EMAIL_TEMPLATE_DIR = 'templates';
export const EMAIL_QUEUE_OPTIONS = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
  },
};

export const DEFAULT_RATE_LIMIT = {
  points: 100,
  duration: 3600,
};
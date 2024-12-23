import { ConfigService } from '@nestjs/config';
import { EmailTemplateService } from './email-template.service';
import { SentMessageInfo } from 'nodemailer';
export interface EmailOptions {
    to: string | string[];
    subject: string;
    template?: string;
    context?: Record<string, any>;
    text?: string;
    html?: string;
}
export declare class EmailService {
    private readonly configService;
    private readonly templateService;
    private readonly transporter;
    private readonly logger;
    constructor(configService: ConfigService, templateService: EmailTemplateService);
    onModuleInit(): Promise<void>;
    sendEmail(options: EmailOptions): Promise<SentMessageInfo>;
    sendVerificationEmail(email: string, token: string): Promise<void>;
    sendPasswordResetEmail(email: string, token: string): Promise<void>;
    sendWelcomeEmail(email: string, username: string): Promise<void>;
}

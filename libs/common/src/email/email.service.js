"use strict";
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
const email_template_service_1 = require("./email-template.service");
let EmailService = EmailService_1 = class EmailService {
    constructor(configService, templateService) {
        this.configService = configService;
        this.templateService = templateService;
        this.logger = new common_1.Logger(EmailService_1.name);
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('EMAIL_HOST'),
            port: this.configService.get('EMAIL_PORT'),
            secure: this.configService.get('EMAIL_SECURE', true),
            auth: {
                user: this.configService.get('EMAIL_USER'),
                pass: this.configService.get('EMAIL_PASSWORD'),
            },
        });
    }
    onModuleInit() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield this.transporter.verify();
                this.logger.log('Email service initialized successfully');
            }
            catch (error) {
                this.logger.error('Failed to initialize email service', error);
                throw error;
            }
        });
    }
    sendEmail(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                let html = options.html;
                let text = options.text;
                if (options.template) {
                    html = yield this.templateService.renderTemplate(options.template, options.context || {});
                }
                const mailOptions = {
                    from: this.configService.get('EMAIL_FROM'),
                    to: options.to,
                    subject: options.subject,
                    text,
                    html,
                };
                const result = yield this.transporter.sendMail(mailOptions);
                this.logger.debug(`Email sent successfully to ${options.to}`);
                return result;
            }
            catch (error) {
                this.logger.error(`Failed to send email to ${options.to}`, error);
                throw error;
            }
        });
    }
    sendVerificationEmail(email, token) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const verificationUrl = `${this.configService.get('APP_URL')}/verify-email?token=${token}`;
            yield this.sendEmail({
                to: email,
                subject: 'Verify Your Email Address',
                template: 'verification',
                context: {
                    verificationUrl,
                    supportEmail: this.configService.get('SUPPORT_EMAIL'),
                },
            });
        });
    }
    sendPasswordResetEmail(email, token) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const resetUrl = `${this.configService.get('APP_URL')}/reset-password?token=${token}`;
            yield this.sendEmail({
                to: email,
                subject: 'Reset Your Password',
                template: 'password-reset',
                context: {
                    resetUrl,
                    supportEmail: this.configService.get('SUPPORT_EMAIL'),
                },
            });
        });
    }
    sendWelcomeEmail(email, username) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.sendEmail({
                to: email,
                subject: 'Welcome to Crypto Portfolio Tracker',
                template: 'welcome',
                context: {
                    username,
                    supportEmail: this.configService.get('SUPPORT_EMAIL'),
                },
            });
        });
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [config_1.ConfigService,
        email_template_service_1.EmailTemplateService])
], EmailService);
//# sourceMappingURL=email.service.js.map
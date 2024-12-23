"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const email_template_service_1 = require("./email-template.service");
const email_service_1 = require("./email.service");
let EmailModule = class EmailModule {
};
exports.EmailModule = EmailModule;
exports.EmailModule = EmailModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [email_service_1.EmailService, email_template_service_1.EmailTemplateService],
        exports: [email_service_1.EmailService],
    })
], EmailModule);
//# sourceMappingURL=email.module.js.map
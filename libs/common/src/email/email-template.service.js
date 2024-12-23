"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailTemplateService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const Handlebars = require("handlebars");
let EmailTemplateService = class EmailTemplateService {
    constructor() {
        this.templatesDir = (0, path_1.join)(__dirname, 'templates');
        this.templateCache = {};
    }
    getTemplate(name) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.templateCache[name]) {
                return this.templateCache[name];
            }
            const templatePath = (0, path_1.join)(this.templatesDir, `${name}.hbs`);
            const templateContent = yield (0, promises_1.readFile)(templatePath, 'utf-8');
            const template = Handlebars.compile(templateContent);
            this.templateCache[name] = template;
            return template;
        });
    }
    renderTemplate(name, context) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const template = yield this.getTemplate(name);
            return template(context);
        });
    }
};
exports.EmailTemplateService = EmailTemplateService;
exports.EmailTemplateService = EmailTemplateService = tslib_1.__decorate([
    (0, common_1.Injectable)()
], EmailTemplateService);
//# sourceMappingURL=email-template.service.js.map
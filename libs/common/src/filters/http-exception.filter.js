"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: ctx.getRequest().url,
            message: typeof exceptionResponse === 'string'
                ? exceptionResponse
                : exceptionResponse.message || 'Internal server error',
        };
        response.status(status).json(errorResponse);
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = tslib_1.__decorate([
    (0, common_1.Catch)(common_1.HttpException)
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../exceptions");
let AllExceptionsFilter = class AllExceptionsFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : exception instanceof exceptions_1.BaseException
                ? exception.statusCode
                : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception instanceof common_1.HttpException || exception instanceof exceptions_1.BaseException
            ? exception.message
            : 'Internal server error';
        const errorResponse = {
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
        };
        response.status(status).json(errorResponse);
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = tslib_1.__decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransformInterceptor = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let TransformInterceptor = class TransformInterceptor {
    intercept(context, next) {
        return next.handle().pipe((0, operators_1.map)(data => ({
            data,
            timestamp: new Date().toISOString(),
        })));
    }
};
exports.TransformInterceptor = TransformInterceptor;
exports.TransformInterceptor = TransformInterceptor = tslib_1.__decorate([
    (0, common_1.Injectable)()
], TransformInterceptor);
//# sourceMappingURL=transform.interceptor.js.map
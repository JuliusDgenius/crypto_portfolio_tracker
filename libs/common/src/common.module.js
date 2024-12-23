"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const filters_1 = require("./filters");
const interceptors_1 = require("./interceptors");
const pipes_1 = require("./pipes");
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = tslib_1.__decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: core_1.APP_FILTER,
                useClass: filters_1.HttpExceptionFilter,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: filters_1.AllExceptionsFilter,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: interceptors_1.LoggingInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: interceptors_1.TransformInterceptor,
            },
            {
                provide: core_1.APP_PIPE,
                useClass: pipes_1.ValidationPipe,
            },
        ],
        exports: [],
    })
], CommonModule);
//# sourceMappingURL=common.module.js.map
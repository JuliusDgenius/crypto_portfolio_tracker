"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationPipe = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
let ValidationPipe = class ValidationPipe {
    transform(value_1, _a) {
        return tslib_1.__awaiter(this, arguments, void 0, function* (value, { metatype }) {
            if (!metatype || !this.toValidate(metatype)) {
                return value;
            }
            const object = (0, class_transformer_1.plainToInstance)(metatype, value);
            const errors = yield (0, class_validator_1.validate)(object);
            if (errors.length > 0) {
                const messages = errors.map(error => Object.values(error.constraints || {}).join(', '));
                throw new common_1.BadRequestException(messages);
            }
            return object;
        });
    }
    toValidate(metatype) {
        const types = [String, Boolean, Number, Array, Object];
        return !types.includes(metatype);
    }
};
exports.ValidationPipe = ValidationPipe;
exports.ValidationPipe = ValidationPipe = tslib_1.__decorate([
    (0, common_1.Injectable)()
], ValidationPipe);
//# sourceMappingURL=validation.pipe.js.map
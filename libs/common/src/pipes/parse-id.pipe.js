"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseIdPipe = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
let ParseIdPipe = class ParseIdPipe {
    transform(value) {
        if (!value || typeof value !== 'string' || value.trim().length === 0) {
            throw new common_1.BadRequestException('Invalid ID format');
        }
        return value;
    }
};
exports.ParseIdPipe = ParseIdPipe;
exports.ParseIdPipe = ParseIdPipe = tslib_1.__decorate([
    (0, common_1.Injectable)()
], ParseIdPipe);
//# sourceMappingURL=parse-id.pipe.js.map
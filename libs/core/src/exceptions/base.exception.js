"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseException = void 0;
class BaseException extends Error {
    constructor(message, code, status = 500) {
        super(message);
        this.message = message;
        this.code = code;
        this.status = status;
        this.name = this.constructor.name;
    }
}
exports.BaseException = BaseException;
//# sourceMappingURL=base.exception.js.map
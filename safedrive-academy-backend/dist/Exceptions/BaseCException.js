"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCException = void 0;
class BaseCException extends Error {
    StatusCode;
    ValidationErrors;
    constructor(message, validationErrors = [], statusCode = 500) {
        super(message);
        this.name = this.constructor.name;
        this.StatusCode = statusCode;
        this.ValidationErrors = validationErrors.length > 0 ? validationErrors : [message];
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.BaseCException = BaseCException;

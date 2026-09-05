"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationCException = void 0;
const BaseCException_1 = require("./BaseCException");
class ValidationCException extends BaseCException_1.BaseCException {
    constructor(messageOrErrors, statusCode = 400) {
        if (Array.isArray(messageOrErrors)) {
            super(messageOrErrors[0] || "Validation failed.", messageOrErrors, statusCode);
        }
        else {
            super(messageOrErrors, [messageOrErrors], statusCode);
        }
    }
}
exports.ValidationCException = ValidationCException;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundCException = void 0;
const BaseCException_1 = require("./BaseCException");
class NotFoundCException extends BaseCException_1.BaseCException {
    constructor(message = "Resource not found.") {
        super(message, [message], 404);
    }
}
exports.NotFoundCException = NotFoundCException;

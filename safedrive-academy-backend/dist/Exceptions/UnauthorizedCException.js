"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedCException = void 0;
const BaseCException_1 = require("./BaseCException");
class UnauthorizedCException extends BaseCException_1.BaseCException {
    constructor(message = "Unauthorized access.") {
        super(message, [message], 401);
    }
}
exports.UnauthorizedCException = UnauthorizedCException;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationCException = void 0;
const BaseCException_1 = require("./BaseCException");
class ConfigurationCException extends BaseCException_1.BaseCException {
    constructor(message) {
        super(message, [message], 500);
    }
}
exports.ConfigurationCException = ConfigurationCException;

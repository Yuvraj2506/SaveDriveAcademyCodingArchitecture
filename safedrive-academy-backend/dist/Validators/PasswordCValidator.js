"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordCValidator = void 0;
class PasswordCValidator {
    static _current = new PasswordCValidator();
    static _minimumLength = 8;
    static get Current() {
        return PasswordCValidator._current;
    }
    constructor() { }
    Validate(password) {
        if (!password || typeof password !== "string") {
            return false;
        }
        return password.length >= PasswordCValidator._minimumLength;
    }
}
exports.PasswordCValidator = PasswordCValidator;

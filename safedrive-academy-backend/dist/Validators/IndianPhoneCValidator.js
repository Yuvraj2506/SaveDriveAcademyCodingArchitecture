"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndianPhoneCValidator = void 0;
class IndianPhoneCValidator {
    static _current = new IndianPhoneCValidator();
    static _phoneRegex = /^[6-9]\d{9}$/;
    static get Current() {
        return IndianPhoneCValidator._current;
    }
    constructor() { }
    Validate(phoneNumber) {
        if (!phoneNumber || typeof phoneNumber !== "string") {
            return false;
        }
        return IndianPhoneCValidator._phoneRegex.test(phoneNumber.trim());
    }
}
exports.IndianPhoneCValidator = IndianPhoneCValidator;

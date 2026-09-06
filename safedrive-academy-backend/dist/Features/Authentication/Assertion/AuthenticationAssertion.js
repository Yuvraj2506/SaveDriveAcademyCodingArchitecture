"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationAssertion = void 0;
const ValidationCException_1 = require("../../../Exceptions/ValidationCException");
const IndianPhoneCValidator_1 = require("../../../Validators/IndianPhoneCValidator");
const PasswordCValidator_1 = require("../../../Validators/PasswordCValidator");
const AuthenticationConstant_1 = require("../Constants/AuthenticationConstant");
class AuthenticationAssertion {
    static _current = new AuthenticationAssertion();
    static get Current() {
        return AuthenticationAssertion._current;
    }
    constructor() { }
    CheckForNullRequest(request, errorMessage = AuthenticationConstant_1.AuthenticationConstant.REQUEST_BODY_EMPTY) {
        if (request === null || request === undefined || typeof request !== "object" || Object.keys(request).length === 0) {
            throw new ValidationCException_1.ValidationCException(errorMessage);
        }
    }
    AssertLoginRequest(request) {
        this.CheckForNullRequest(request, AuthenticationConstant_1.AuthenticationConstant.REQUEST_BODY_EMPTY);
        const validationErrors = [];
        if (!IndianPhoneCValidator_1.IndianPhoneCValidator.Current.Validate(request.PhoneNumber)) {
            validationErrors.push(AuthenticationConstant_1.AuthenticationConstant.PHONE_REQUIRED);
        }
        if (!PasswordCValidator_1.PasswordCValidator.Current.Validate(request.Password)) {
            validationErrors.push(AuthenticationConstant_1.AuthenticationConstant.PASSWORD_REQUIRED);
        }
        if (validationErrors.length > 0) {
            throw new ValidationCException_1.ValidationCException(validationErrors);
        }
    }
    AssertRefreshTokenRequest(request) {
        this.CheckForNullRequest(request, AuthenticationConstant_1.AuthenticationConstant.REQUEST_BODY_EMPTY);
        const validationErrors = [];
        if (!request.RefreshToken || typeof request.RefreshToken !== "string" || request.RefreshToken.trim() === "") {
            validationErrors.push(AuthenticationConstant_1.AuthenticationConstant.REFRESH_TOKEN_REQUIRED);
        }
        if (validationErrors.length > 0) {
            throw new ValidationCException_1.ValidationCException(validationErrors);
        }
    }
    AssertVerifyPhoneRequest(request) {
        this.CheckForNullRequest(request, AuthenticationConstant_1.AuthenticationConstant.REQUEST_BODY_EMPTY);
        const validationErrors = [];
        if (!IndianPhoneCValidator_1.IndianPhoneCValidator.Current.Validate(request.PhoneNumber)) {
            validationErrors.push(AuthenticationConstant_1.AuthenticationConstant.PHONE_REQUIRED);
        }
        if (validationErrors.length > 0) {
            throw new ValidationCException_1.ValidationCException(validationErrors);
        }
    }
    AssertSetPasswordRequest(request) {
        this.CheckForNullRequest(request, AuthenticationConstant_1.AuthenticationConstant.REQUEST_BODY_EMPTY);
        const validationErrors = [];
        if (!IndianPhoneCValidator_1.IndianPhoneCValidator.Current.Validate(request.PhoneNumber)) {
            validationErrors.push(AuthenticationConstant_1.AuthenticationConstant.PHONE_REQUIRED);
        }
        if (!PasswordCValidator_1.PasswordCValidator.Current.Validate(request.Password)) {
            validationErrors.push(AuthenticationConstant_1.AuthenticationConstant.PASSWORD_REQUIRED);
        }
        if (validationErrors.length > 0) {
            throw new ValidationCException_1.ValidationCException(validationErrors);
        }
    }
}
exports.AuthenticationAssertion = AuthenticationAssertion;

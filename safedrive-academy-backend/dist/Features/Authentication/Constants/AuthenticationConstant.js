"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationConstant = void 0;
class AuthenticationConstant {
    static LOGIN_SUCCESS = "User logged in successfully.";
    static INVALID_CREDENTIALS = "Invalid phone number or password.";
    static ACCOUNT_DEACTIVATED = "Account is deactivated. Please contact the administrator.";
    static USER_NOT_FOUND = "No user found with the provided phone number.";
    static PHONE_REQUIRED = "Phone number is required and must be a valid 10-digit Indian number.";
    static PASSWORD_REQUIRED = "Password is required and must be at least 8 characters long.";
    static REQUEST_BODY_EMPTY = "Login request body cannot be empty.";
}
exports.AuthenticationConstant = AuthenticationConstant;

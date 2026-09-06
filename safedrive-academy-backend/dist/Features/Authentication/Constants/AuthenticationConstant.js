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
    static REFRESH_SUCCESS = "Token refreshed successfully.";
    static LOGOUT_SUCCESS = "User logged out successfully.";
    static REFRESH_TOKEN_REQUIRED = "Refresh token is required.";
    static INVALID_OR_EXPIRED_REFRESH_TOKEN = "Invalid or expired refresh token.";
    static REGISTRATION_NOT_FOUND = "No registration found for this mobile number. Please register with academy staff.";
    static REGISTRATION_PENDING_APPROVAL = "Your registration request is awaiting Owner approval. Please wait for approval before activating your account.";
    static REGISTRATION_REJECTED = "Your registration request was declined. Please contact academy office.";
    static PHONE_VERIFIED_SUCCESS = "Mobile number verified successfully. Please set your password.";
    static ACCOUNT_ACTIVATED_SUCCESS = "Account activated and password set successfully.";
}
exports.AuthenticationConstant = AuthenticationConstant;

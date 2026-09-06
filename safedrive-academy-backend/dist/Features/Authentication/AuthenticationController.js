"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationController = void 0;
const express_1 = require("express");
const ApplicationRouteFactory_1 = require("../../Factories/ApplicationRouteFactory");
const ApiResponseClass_1 = require("../../Models/Classes/ApiResponseClass");
const BaseCException_1 = require("../../Exceptions/BaseCException");
const ValidationCException_1 = require("../../Exceptions/ValidationCException");
const UnauthorizedCException_1 = require("../../Exceptions/UnauthorizedCException");
const NotFoundCException_1 = require("../../Exceptions/NotFoundCException");
const AuthenticationAssertion_1 = require("./Assertion/AuthenticationAssertion");
const AuthenticationService_1 = require("./Services/AuthenticationService");
const AuthenticationConstant_1 = require("./Constants/AuthenticationConstant");
class AuthenticationController {
    static _current = new AuthenticationController();
    _router;
    static get Current() {
        return AuthenticationController._current;
    }
    constructor() {
        this._router = (0, express_1.Router)();
        this.RegisterRoutes();
    }
    get Router() {
        return this._router;
    }
    RegisterRoutes() {
        this._router.post(ApplicationRouteFactory_1.ApplicationRouteFactory.AuthenticationRoutes.Login, this.Login.bind(this));
        this._router.post(ApplicationRouteFactory_1.ApplicationRouteFactory.AuthenticationRoutes.RefreshToken, this.RefreshToken.bind(this));
        this._router.post(ApplicationRouteFactory_1.ApplicationRouteFactory.AuthenticationRoutes.Logout, this.Logout.bind(this));
        this._router.post(ApplicationRouteFactory_1.ApplicationRouteFactory.AuthenticationRoutes.VerifyPhone, this.VerifyPhone.bind(this));
        this._router.post(ApplicationRouteFactory_1.ApplicationRouteFactory.AuthenticationRoutes.SetPassword, this.SetPassword.bind(this));
    }
    async Login(req, res) {
        try {
            const request = req.body;
            AuthenticationAssertion_1.AuthenticationAssertion.Current.CheckForNullRequest(request);
            AuthenticationAssertion_1.AuthenticationAssertion.Current.AssertLoginRequest(request);
            const response = await AuthenticationService_1.AuthenticationService.Current.LoginAsync(request);
            res
                .status(200)
                .json(ApiResponseClass_1.ApiResponseClass.Succeeded(response, AuthenticationConstant_1.AuthenticationConstant.LOGIN_SUCCESS, 200));
        }
        catch (error) {
            this.HandleError(res, error, "Login");
        }
    }
    async RefreshToken(req, res) {
        try {
            const request = req.body;
            AuthenticationAssertion_1.AuthenticationAssertion.Current.AssertRefreshTokenRequest(request);
            const response = await AuthenticationService_1.AuthenticationService.Current.RefreshTokenAsync(request);
            res
                .status(200)
                .json(ApiResponseClass_1.ApiResponseClass.Succeeded(response, AuthenticationConstant_1.AuthenticationConstant.REFRESH_SUCCESS, 200));
        }
        catch (error) {
            this.HandleError(res, error, "RefreshToken");
        }
    }
    async Logout(req, res) {
        try {
            const request = req.body || {};
            const authHeader = req.headers.authorization;
            await AuthenticationService_1.AuthenticationService.Current.LogoutAsync(request.RefreshToken, authHeader);
            res
                .status(200)
                .json(ApiResponseClass_1.ApiResponseClass.Succeeded(null, AuthenticationConstant_1.AuthenticationConstant.LOGOUT_SUCCESS, 200));
        }
        catch (error) {
            this.HandleError(res, error, "Logout");
        }
    }
    async VerifyPhone(req, res) {
        try {
            const request = req.body;
            AuthenticationAssertion_1.AuthenticationAssertion.Current.AssertVerifyPhoneRequest(request);
            const response = await AuthenticationService_1.AuthenticationService.Current.VerifyPhoneAsync(request);
            res
                .status(200)
                .json(ApiResponseClass_1.ApiResponseClass.Succeeded(response, AuthenticationConstant_1.AuthenticationConstant.PHONE_VERIFIED_SUCCESS, 200));
        }
        catch (error) {
            this.HandleError(res, error, "VerifyPhone");
        }
    }
    async SetPassword(req, res) {
        try {
            const request = req.body;
            AuthenticationAssertion_1.AuthenticationAssertion.Current.AssertSetPasswordRequest(request);
            const response = await AuthenticationService_1.AuthenticationService.Current.SetPasswordAsync(request);
            res
                .status(200)
                .json(ApiResponseClass_1.ApiResponseClass.Succeeded(response, AuthenticationConstant_1.AuthenticationConstant.ACCOUNT_ACTIVATED_SUCCESS, 200));
        }
        catch (error) {
            this.HandleError(res, error, "SetPassword");
        }
    }
    HandleError(res, error, contextName) {
        if (error instanceof ValidationCException_1.ValidationCException) {
            res
                .status(error.StatusCode)
                .json(ApiResponseClass_1.ApiResponseClass.Failed(error.message, error.ValidationErrors, error.StatusCode));
            return;
        }
        if (error instanceof UnauthorizedCException_1.UnauthorizedCException) {
            res
                .status(error.StatusCode)
                .json(ApiResponseClass_1.ApiResponseClass.Failed(error.message, error.ValidationErrors, error.StatusCode));
            return;
        }
        if (error instanceof NotFoundCException_1.NotFoundCException) {
            res
                .status(error.StatusCode)
                .json(ApiResponseClass_1.ApiResponseClass.Failed(error.message, error.ValidationErrors, error.StatusCode));
            return;
        }
        if (error instanceof BaseCException_1.BaseCException) {
            res
                .status(error.StatusCode)
                .json(ApiResponseClass_1.ApiResponseClass.Failed(error.message, error.ValidationErrors, error.StatusCode));
            return;
        }
        console.error(`[AuthenticationController] Unexpected error in ${contextName}:`, error);
        res
            .status(500)
            .json(ApiResponseClass_1.ApiResponseClass.Failed(`An unexpected error occurred while processing the ${contextName} request.`, [error?.message || "Internal server error."], 500));
    }
}
exports.AuthenticationController = AuthenticationController;

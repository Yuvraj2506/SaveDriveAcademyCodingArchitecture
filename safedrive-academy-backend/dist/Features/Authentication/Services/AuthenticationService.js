"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ENValidatorUtility_1 = require("../../../Utilities/ENValidatorUtility");
const UnauthorizedCException_1 = require("../../../Exceptions/UnauthorizedCException");
const AuthenticationConstant_1 = require("../Constants/AuthenticationConstant");
const UserModel_1 = require("../Models/UserModel");
class AuthenticationService {
    static _current = new AuthenticationService();
    static get Current() {
        return AuthenticationService._current;
    }
    constructor() { }
    async LoginAsync(request) {
        const normalizedPhone = request.PhoneNumber.trim();
        const user = await UserModel_1.UserModel.findOne({
            PhoneNumber: normalizedPhone
        }).exec();
        if (!user) {
            throw new UnauthorizedCException_1.UnauthorizedCException(AuthenticationConstant_1.AuthenticationConstant.INVALID_CREDENTIALS);
        }
        if (!user.IsActive) {
            throw new UnauthorizedCException_1.UnauthorizedCException(AuthenticationConstant_1.AuthenticationConstant.ACCOUNT_DEACTIVATED);
        }
        const isPasswordMatch = await bcryptjs_1.default.compare(request.Password, user.Password);
        if (!isPasswordMatch) {
            throw new UnauthorizedCException_1.UnauthorizedCException(AuthenticationConstant_1.AuthenticationConstant.INVALID_CREDENTIALS);
        }
        const tokenPayload = {
            Id: user._id.toString(),
            PhoneNumber: user.PhoneNumber,
            Role: user.Role
        };
        const jwtSecret = ENValidatorUtility_1.ENValidatorUtility.Current.JwtSecret;
        const jwtExpiresIn = ENValidatorUtility_1.ENValidatorUtility.Current.JwtExpiresIn;
        const signOptions = {
            expiresIn: jwtExpiresIn
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, jwtSecret, signOptions);
        const userDto = {
            Id: user._id.toString(),
            PhoneNumber: user.PhoneNumber,
            FullName: user.FullName,
            Role: user.Role,
            IsActive: user.IsActive
        };
        return {
            Token: token,
            User: userDto
        };
    }
}
exports.AuthenticationService = AuthenticationService;

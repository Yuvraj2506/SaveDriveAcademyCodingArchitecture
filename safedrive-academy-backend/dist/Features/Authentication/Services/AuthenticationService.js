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
const ValidationCException_1 = require("../../../Exceptions/ValidationCException");
const NotFoundCException_1 = require("../../../Exceptions/NotFoundCException");
const AuthenticationConstant_1 = require("../Constants/AuthenticationConstant");
const UserModel_1 = require("../Models/UserModel");
const StudentModel_1 = require("../../../Models/StudentModel");
const UserRoleEnum_1 = require("../Models/UserRoleEnum");
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
        const jwtAccessExpiresIn = ENValidatorUtility_1.ENValidatorUtility.Current.JwtAccessExpiresIn;
        const accessSignOptions = {
            expiresIn: jwtAccessExpiresIn
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, jwtSecret, accessSignOptions);
        const refreshPayload = {
            Id: user._id.toString(),
            PhoneNumber: user.PhoneNumber,
            Type: "refresh"
        };
        const jwtRefreshSecret = ENValidatorUtility_1.ENValidatorUtility.Current.JwtRefreshSecret;
        const jwtRefreshExpiresIn = ENValidatorUtility_1.ENValidatorUtility.Current.JwtRefreshExpiresIn;
        const refreshSignOptions = {
            expiresIn: jwtRefreshExpiresIn
        };
        const refreshToken = jsonwebtoken_1.default.sign(refreshPayload, jwtRefreshSecret, refreshSignOptions);
        if (!user.RefreshTokens) {
            user.RefreshTokens = [];
        }
        user.RefreshTokens.push(refreshToken);
        if (user.RefreshTokens.length > 5) {
            user.RefreshTokens.shift();
        }
        await user.save();
        const userDto = {
            Id: user._id.toString(),
            PhoneNumber: user.PhoneNumber,
            FullName: user.FullName,
            Role: user.Role,
            IsActive: user.IsActive
        };
        return {
            Token: token,
            RefreshToken: refreshToken,
            User: userDto
        };
    }
    async RefreshTokenAsync(request) {
        const refreshToken = request.RefreshToken.trim();
        const jwtRefreshSecret = ENValidatorUtility_1.ENValidatorUtility.Current.JwtRefreshSecret;
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(refreshToken, jwtRefreshSecret);
        }
        catch {
            throw new UnauthorizedCException_1.UnauthorizedCException(AuthenticationConstant_1.AuthenticationConstant.INVALID_OR_EXPIRED_REFRESH_TOKEN);
        }
        if (!payload || !payload.Id) {
            throw new UnauthorizedCException_1.UnauthorizedCException(AuthenticationConstant_1.AuthenticationConstant.INVALID_OR_EXPIRED_REFRESH_TOKEN);
        }
        const user = await UserModel_1.UserModel.findById(payload.Id).exec();
        if (!user || !user.IsActive) {
            throw new UnauthorizedCException_1.UnauthorizedCException(AuthenticationConstant_1.AuthenticationConstant.INVALID_OR_EXPIRED_REFRESH_TOKEN);
        }
        if (!user.RefreshTokens || !user.RefreshTokens.includes(refreshToken)) {
            throw new UnauthorizedCException_1.UnauthorizedCException(AuthenticationConstant_1.AuthenticationConstant.INVALID_OR_EXPIRED_REFRESH_TOKEN);
        }
        // Token rotation: remove used refresh token
        user.RefreshTokens = user.RefreshTokens.filter((t) => t !== refreshToken);
        const tokenPayload = {
            Id: user._id.toString(),
            PhoneNumber: user.PhoneNumber,
            Role: user.Role
        };
        const jwtSecret = ENValidatorUtility_1.ENValidatorUtility.Current.JwtSecret;
        const jwtAccessExpiresIn = ENValidatorUtility_1.ENValidatorUtility.Current.JwtAccessExpiresIn;
        const newAccessToken = jsonwebtoken_1.default.sign(tokenPayload, jwtSecret, { expiresIn: jwtAccessExpiresIn });
        const newRefreshPayload = {
            Id: user._id.toString(),
            PhoneNumber: user.PhoneNumber,
            Type: "refresh"
        };
        const jwtRefreshExpiresIn = ENValidatorUtility_1.ENValidatorUtility.Current.JwtRefreshExpiresIn;
        const newRefreshToken = jsonwebtoken_1.default.sign(newRefreshPayload, jwtRefreshSecret, { expiresIn: jwtRefreshExpiresIn });
        user.RefreshTokens.push(newRefreshToken);
        if (user.RefreshTokens.length > 5) {
            user.RefreshTokens.shift();
        }
        await user.save();
        return {
            Token: newAccessToken,
            RefreshToken: newRefreshToken
        };
    }
    async LogoutAsync(refreshToken, authHeader) {
        if (refreshToken && refreshToken.trim() !== "") {
            const trimmed = refreshToken.trim();
            await UserModel_1.UserModel.updateMany({ RefreshTokens: trimmed }, { $pull: { RefreshTokens: trimmed } }).exec();
            return;
        }
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7).trim();
            const jwtSecret = ENValidatorUtility_1.ENValidatorUtility.Current.JwtSecret;
            try {
                const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
                if (decoded && decoded.Id) {
                    await UserModel_1.UserModel.findByIdAndUpdate(decoded.Id, { $set: { RefreshTokens: [] } }).exec();
                }
            }
            catch {
                // Token might already be expired, ignore
            }
        }
    }
    async VerifyPhoneAsync(request) {
        const normalizedPhone = request.PhoneNumber.trim();
        const student = await StudentModel_1.StudentModel.findOne({ PhoneNumber: normalizedPhone }).exec();
        if (!student) {
            const existingUser = await UserModel_1.UserModel.findOne({ PhoneNumber: normalizedPhone }).exec();
            if (existingUser && existingUser.Role === UserRoleEnum_1.UserRoleEnum.Student) {
                return {
                    PhoneNumber: existingUser.PhoneNumber,
                    FullName: existingUser.FullName,
                    Status: StudentModel_1.StudentRequestStatusEnum.Approved,
                    IsApproved: true
                };
            }
            throw new NotFoundCException_1.NotFoundCException(AuthenticationConstant_1.AuthenticationConstant.REGISTRATION_NOT_FOUND);
        }
        if (student.Status === StudentModel_1.StudentRequestStatusEnum.Pending) {
            throw new ValidationCException_1.ValidationCException(AuthenticationConstant_1.AuthenticationConstant.REGISTRATION_PENDING_APPROVAL);
        }
        if (student.Status === StudentModel_1.StudentRequestStatusEnum.Rejected) {
            throw new ValidationCException_1.ValidationCException(AuthenticationConstant_1.AuthenticationConstant.REGISTRATION_REJECTED);
        }
        return {
            PhoneNumber: student.PhoneNumber,
            FullName: student.Name,
            Status: student.Status,
            IsApproved: true
        };
    }
    async SetPasswordAsync(request) {
        const normalizedPhone = request.PhoneNumber.trim();
        const student = await StudentModel_1.StudentModel.findOne({ PhoneNumber: normalizedPhone }).exec();
        let studentName = "Student";
        if (student) {
            if (student.Status === StudentModel_1.StudentRequestStatusEnum.Pending) {
                throw new ValidationCException_1.ValidationCException(AuthenticationConstant_1.AuthenticationConstant.REGISTRATION_PENDING_APPROVAL);
            }
            if (student.Status === StudentModel_1.StudentRequestStatusEnum.Rejected) {
                throw new ValidationCException_1.ValidationCException(AuthenticationConstant_1.AuthenticationConstant.REGISTRATION_REJECTED);
            }
            studentName = student.Name;
        }
        else {
            const existingUser = await UserModel_1.UserModel.findOne({ PhoneNumber: normalizedPhone }).exec();
            if (!existingUser) {
                throw new NotFoundCException_1.NotFoundCException(AuthenticationConstant_1.AuthenticationConstant.REGISTRATION_NOT_FOUND);
            }
            studentName = existingUser.FullName;
        }
        const hashedPassword = await bcryptjs_1.default.hash(request.Password, 10);
        const user = await UserModel_1.UserModel.findOneAndUpdate({ PhoneNumber: normalizedPhone }, {
            $set: {
                FullName: studentName,
                Password: hashedPassword,
                Role: UserRoleEnum_1.UserRoleEnum.Student,
                IsActive: true
            }
        }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }).exec();
        const tokenPayload = {
            Id: user._id.toString(),
            PhoneNumber: user.PhoneNumber,
            Role: user.Role
        };
        const jwtSecret = ENValidatorUtility_1.ENValidatorUtility.Current.JwtSecret;
        const jwtAccessExpiresIn = ENValidatorUtility_1.ENValidatorUtility.Current.JwtAccessExpiresIn;
        const accessSignOptions = {
            expiresIn: jwtAccessExpiresIn
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, jwtSecret, accessSignOptions);
        const refreshPayload = {
            Id: user._id.toString(),
            PhoneNumber: user.PhoneNumber,
            Type: "refresh"
        };
        const jwtRefreshSecret = ENValidatorUtility_1.ENValidatorUtility.Current.JwtRefreshSecret;
        const jwtRefreshExpiresIn = ENValidatorUtility_1.ENValidatorUtility.Current.JwtRefreshExpiresIn;
        const refreshSignOptions = {
            expiresIn: jwtRefreshExpiresIn
        };
        const refreshToken = jsonwebtoken_1.default.sign(refreshPayload, jwtRefreshSecret, refreshSignOptions);
        if (!user.RefreshTokens) {
            user.RefreshTokens = [];
        }
        user.RefreshTokens.push(refreshToken);
        if (user.RefreshTokens.length > 5) {
            user.RefreshTokens.shift();
        }
        await user.save();
        const userDto = {
            Id: user._id.toString(),
            PhoneNumber: user.PhoneNumber,
            FullName: user.FullName,
            Role: user.Role,
            IsActive: user.IsActive
        };
        return {
            Token: token,
            RefreshToken: refreshToken,
            User: userDto
        };
    }
}
exports.AuthenticationService = AuthenticationService;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoleMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ENValidatorUtility_1 = require("../Utilities/ENValidatorUtility");
const UnauthorizedCException_1 = require("../Exceptions/UnauthorizedCException");
class AuthRoleMiddleware {
    static _current = new AuthRoleMiddleware();
    static get Current() {
        return AuthRoleMiddleware._current;
    }
    constructor() { }
    AuthorizeRoles(...allowedRoles) {
        return (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    throw new UnauthorizedCException_1.UnauthorizedCException("Authentication token is required to access this resource.");
                }
                const token = authHeader.substring(7).trim();
                const jwtSecret = ENValidatorUtility_1.ENValidatorUtility.Current.JwtSecret;
                let decoded;
                try {
                    decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
                }
                catch {
                    throw new UnauthorizedCException_1.UnauthorizedCException("Invalid or expired authentication token.");
                }
                if (!decoded || !decoded.Id || !decoded.Role) {
                    throw new UnauthorizedCException_1.UnauthorizedCException("Malformed authentication token payload.");
                }
                if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.Role)) {
                    throw new UnauthorizedCException_1.UnauthorizedCException(`Access denied. Required role: [${allowedRoles.join(", ")}], current role: ${decoded.Role}.`);
                }
                req.UserContext = {
                    Id: decoded.Id,
                    PhoneNumber: decoded.PhoneNumber,
                    Role: decoded.Role
                };
                next();
            }
            catch (error) {
                next(error);
            }
        };
    }
}
exports.AuthRoleMiddleware = AuthRoleMiddleware;

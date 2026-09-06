import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENValidatorUtility } from "../Utilities/ENValidatorUtility";
import { UnauthorizedCException } from "../Exceptions/UnauthorizedCException";

export interface AuthenticatedUserContext {
  Id: string;
  PhoneNumber: string;
  Role: string;
}

export interface AuthenticatedRequest extends Request {
  UserContext?: AuthenticatedUserContext;
}

export class AuthRoleMiddleware {
  private static readonly _current: AuthRoleMiddleware = new AuthRoleMiddleware();

  public static get Current(): AuthRoleMiddleware {
    return AuthRoleMiddleware._current;
  }

  private constructor() {}

  public AuthorizeRoles(...allowedRoles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          throw new UnauthorizedCException("Authentication token is required to access this resource.");
        }

        const token = authHeader.substring(7).trim();
        const jwtSecret = ENValidatorUtility.Current.JwtSecret;

        let decoded: any;
        try {
          decoded = jwt.verify(token, jwtSecret);
        } catch {
          throw new UnauthorizedCException("Invalid or expired authentication token.");
        }

        if (!decoded || !decoded.Id || !decoded.Role) {
          throw new UnauthorizedCException("Malformed authentication token payload.");
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.Role)) {
          throw new UnauthorizedCException(
            `Access denied. Required role: [${allowedRoles.join(", ")}], current role: ${decoded.Role}.`
          );
        }

        req.UserContext = {
          Id: decoded.Id,
          PhoneNumber: decoded.PhoneNumber,
          Role: decoded.Role
        };

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

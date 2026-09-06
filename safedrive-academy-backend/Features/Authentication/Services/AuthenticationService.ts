import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { ENValidatorUtility } from "../../../Utilities/ENValidatorUtility";
import { UnauthorizedCException } from "../../../Exceptions/UnauthorizedCException";
import { ValidationCException } from "../../../Exceptions/ValidationCException";
import { NotFoundCException } from "../../../Exceptions/NotFoundCException";
import { AuthenticationConstant } from "../Constants/AuthenticationConstant";
import { UserModel, IUserDocument } from "../Models/UserModel";
import { StudentModel, StudentRequestStatusEnum } from "../../../Models/StudentModel";
import { UserRoleEnum } from "../Models/UserRoleEnum";
import { LoginRequestDTO } from "../Models/LoginRequestDTO";
import { LoginResponseDTO } from "../Models/LoginResponseDTO";
import { RefreshTokenRequestDTO } from "../Models/RefreshTokenRequestDTO";
import { RefreshTokenResponseDTO } from "../Models/RefreshTokenResponseDTO";
import { VerifyPhoneRequestDTO } from "../Models/VerifyPhoneRequestDTO";
import { VerifyPhoneResponseDTO } from "../Models/VerifyPhoneResponseDTO";
import { SetPasswordRequestDTO } from "../Models/SetPasswordRequestDTO";
import { UserDTO } from "../Models/UserDTO";

export class AuthenticationService {
  private static readonly _current: AuthenticationService = new AuthenticationService();

  public static get Current(): AuthenticationService {
    return AuthenticationService._current;
  }

  private constructor() {}

  public async LoginAsync(request: LoginRequestDTO): Promise<LoginResponseDTO> {
    const normalizedPhone: string = request.PhoneNumber.trim();

    const user: IUserDocument | null = await UserModel.findOne({
      PhoneNumber: normalizedPhone
    }).exec();

    if (!user) {
      throw new UnauthorizedCException(AuthenticationConstant.INVALID_CREDENTIALS);
    }

    if (!user.IsActive) {
      throw new UnauthorizedCException(AuthenticationConstant.ACCOUNT_DEACTIVATED);
    }

    const isPasswordMatch: boolean = await bcrypt.compare(request.Password, user.Password);
    if (!isPasswordMatch) {
      throw new UnauthorizedCException(AuthenticationConstant.INVALID_CREDENTIALS);
    }

    const tokenPayload = {
      Id: user._id.toString(),
      PhoneNumber: user.PhoneNumber,
      Role: user.Role
    };

    const jwtSecret: string = ENValidatorUtility.Current.JwtSecret;
    const jwtAccessExpiresIn: string = ENValidatorUtility.Current.JwtAccessExpiresIn;

    const accessSignOptions: SignOptions = {
      expiresIn: jwtAccessExpiresIn as any
    };

    const token: string = jwt.sign(tokenPayload, jwtSecret, accessSignOptions);

    const refreshPayload = {
      Id: user._id.toString(),
      PhoneNumber: user.PhoneNumber,
      Type: "refresh"
    };

    const jwtRefreshSecret: string = ENValidatorUtility.Current.JwtRefreshSecret;
    const jwtRefreshExpiresIn: string = ENValidatorUtility.Current.JwtRefreshExpiresIn;

    const refreshSignOptions: SignOptions = {
      expiresIn: jwtRefreshExpiresIn as any
    };

    const refreshToken: string = jwt.sign(refreshPayload, jwtRefreshSecret, refreshSignOptions);

    if (!user.RefreshTokens) {
      user.RefreshTokens = [];
    }
    user.RefreshTokens.push(refreshToken);
    if (user.RefreshTokens.length > 5) {
      user.RefreshTokens.shift();
    }
    await user.save();

    const userDto: UserDTO = {
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

  public async RefreshTokenAsync(request: RefreshTokenRequestDTO): Promise<RefreshTokenResponseDTO> {
    const refreshToken: string = request.RefreshToken.trim();
    const jwtRefreshSecret: string = ENValidatorUtility.Current.JwtRefreshSecret;

    let payload: any;
    try {
      payload = jwt.verify(refreshToken, jwtRefreshSecret);
    } catch {
      throw new UnauthorizedCException(AuthenticationConstant.INVALID_OR_EXPIRED_REFRESH_TOKEN);
    }

    if (!payload || !payload.Id) {
      throw new UnauthorizedCException(AuthenticationConstant.INVALID_OR_EXPIRED_REFRESH_TOKEN);
    }

    const user: IUserDocument | null = await UserModel.findById(payload.Id).exec();
    if (!user || !user.IsActive) {
      throw new UnauthorizedCException(AuthenticationConstant.INVALID_OR_EXPIRED_REFRESH_TOKEN);
    }

    if (!user.RefreshTokens || !user.RefreshTokens.includes(refreshToken)) {
      throw new UnauthorizedCException(AuthenticationConstant.INVALID_OR_EXPIRED_REFRESH_TOKEN);
    }

    // Token rotation: remove used refresh token
    user.RefreshTokens = user.RefreshTokens.filter((t: string) => t !== refreshToken);

    const tokenPayload = {
      Id: user._id.toString(),
      PhoneNumber: user.PhoneNumber,
      Role: user.Role
    };
    const jwtSecret: string = ENValidatorUtility.Current.JwtSecret;
    const jwtAccessExpiresIn: string = ENValidatorUtility.Current.JwtAccessExpiresIn;
    const newAccessToken: string = jwt.sign(tokenPayload, jwtSecret, { expiresIn: jwtAccessExpiresIn as any });

    const newRefreshPayload = {
      Id: user._id.toString(),
      PhoneNumber: user.PhoneNumber,
      Type: "refresh"
    };
    const jwtRefreshExpiresIn: string = ENValidatorUtility.Current.JwtRefreshExpiresIn;
    const newRefreshToken: string = jwt.sign(newRefreshPayload, jwtRefreshSecret, { expiresIn: jwtRefreshExpiresIn as any });

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

  public async LogoutAsync(refreshToken?: string, authHeader?: string): Promise<void> {
    if (refreshToken && refreshToken.trim() !== "") {
      const trimmed = refreshToken.trim();
      await UserModel.updateMany(
        { RefreshTokens: trimmed },
        { $pull: { RefreshTokens: trimmed } }
      ).exec();
      return;
    }

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      const jwtSecret: string = ENValidatorUtility.Current.JwtSecret;
      try {
        const decoded: any = jwt.verify(token, jwtSecret);
        if (decoded && decoded.Id) {
          await UserModel.findByIdAndUpdate(decoded.Id, { $set: { RefreshTokens: [] } }).exec();
        }
      } catch {
        // Token might already be expired, ignore
      }
    }
  }

  public async VerifyPhoneAsync(request: VerifyPhoneRequestDTO): Promise<VerifyPhoneResponseDTO> {
    const normalizedPhone: string = request.PhoneNumber.trim();

    const student = await StudentModel.findOne({ PhoneNumber: normalizedPhone }).exec();

    if (!student) {
      const existingUser = await UserModel.findOne({ PhoneNumber: normalizedPhone }).exec();
      if (existingUser && existingUser.Role === UserRoleEnum.Student) {
        return {
          PhoneNumber: existingUser.PhoneNumber,
          FullName: existingUser.FullName,
          Status: StudentRequestStatusEnum.Approved,
          IsApproved: true
        };
      }

      throw new NotFoundCException(AuthenticationConstant.REGISTRATION_NOT_FOUND);
    }

    if (student.Status === StudentRequestStatusEnum.Pending) {
      throw new ValidationCException(AuthenticationConstant.REGISTRATION_PENDING_APPROVAL);
    }

    if (student.Status === StudentRequestStatusEnum.Rejected) {
      throw new ValidationCException(AuthenticationConstant.REGISTRATION_REJECTED);
    }

    return {
      PhoneNumber: student.PhoneNumber,
      FullName: student.Name,
      Status: student.Status,
      IsApproved: true
    };
  }

  public async SetPasswordAsync(request: SetPasswordRequestDTO): Promise<LoginResponseDTO> {
    const normalizedPhone: string = request.PhoneNumber.trim();

    const student = await StudentModel.findOne({ PhoneNumber: normalizedPhone }).exec();

    let studentName = "Student";
    if (student) {
      if (student.Status === StudentRequestStatusEnum.Pending) {
        throw new ValidationCException(AuthenticationConstant.REGISTRATION_PENDING_APPROVAL);
      }
      if (student.Status === StudentRequestStatusEnum.Rejected) {
        throw new ValidationCException(AuthenticationConstant.REGISTRATION_REJECTED);
      }
      studentName = student.Name;
    } else {
      const existingUser = await UserModel.findOne({ PhoneNumber: normalizedPhone }).exec();
      if (!existingUser) {
        throw new NotFoundCException(AuthenticationConstant.REGISTRATION_NOT_FOUND);
      }
      studentName = existingUser.FullName;
    }

    const hashedPassword = await bcrypt.hash(request.Password, 10);

    const user: IUserDocument = await UserModel.findOneAndUpdate(
      { PhoneNumber: normalizedPhone },
      {
        $set: {
          FullName: studentName,
          Password: hashedPassword,
          Role: UserRoleEnum.Student,
          IsActive: true
        }
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    ).exec();

    const tokenPayload = {
      Id: user._id.toString(),
      PhoneNumber: user.PhoneNumber,
      Role: user.Role
    };

    const jwtSecret: string = ENValidatorUtility.Current.JwtSecret;
    const jwtAccessExpiresIn: string = ENValidatorUtility.Current.JwtAccessExpiresIn;

    const accessSignOptions: SignOptions = {
      expiresIn: jwtAccessExpiresIn as any
    };

    const token: string = jwt.sign(tokenPayload, jwtSecret, accessSignOptions);

    const refreshPayload = {
      Id: user._id.toString(),
      PhoneNumber: user.PhoneNumber,
      Type: "refresh"
    };

    const jwtRefreshSecret: string = ENValidatorUtility.Current.JwtRefreshSecret;
    const jwtRefreshExpiresIn: string = ENValidatorUtility.Current.JwtRefreshExpiresIn;

    const refreshSignOptions: SignOptions = {
      expiresIn: jwtRefreshExpiresIn as any
    };

    const refreshToken: string = jwt.sign(refreshPayload, jwtRefreshSecret, refreshSignOptions);

    if (!user.RefreshTokens) {
      user.RefreshTokens = [];
    }
    user.RefreshTokens.push(refreshToken);
    if (user.RefreshTokens.length > 5) {
      user.RefreshTokens.shift();
    }
    await user.save();

    const userDto: UserDTO = {
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


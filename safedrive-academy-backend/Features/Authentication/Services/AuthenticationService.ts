import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { ENValidatorUtility } from "../../../Utilities/ENValidatorUtility";
import { UnauthorizedCException } from "../../../Exceptions/UnauthorizedCException";
import { AuthenticationConstant } from "../Constants/AuthenticationConstant";
import { UserModel, IUserDocument } from "../Models/UserModel";
import { LoginRequestDTO } from "../Models/LoginRequestDTO";
import { LoginResponseDTO } from "../Models/LoginResponseDTO";
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
    const jwtExpiresIn: string = ENValidatorUtility.Current.JwtExpiresIn;

    const signOptions: SignOptions = {
      expiresIn: jwtExpiresIn as any
    };

    const token: string = jwt.sign(tokenPayload, jwtSecret, signOptions);

    const userDto: UserDTO = {
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


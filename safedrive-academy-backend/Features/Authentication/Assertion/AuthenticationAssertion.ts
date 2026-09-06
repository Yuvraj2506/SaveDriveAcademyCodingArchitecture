import { ValidationCException } from "../../../Exceptions/ValidationCException";
import { IndianPhoneCValidator } from "../../../Validators/IndianPhoneCValidator";
import { PasswordCValidator } from "../../../Validators/PasswordCValidator";
import { AuthenticationConstant } from "../Constants/AuthenticationConstant";
import { UserRoleEnum } from "../Models/UserRoleEnum";
import { LoginRequestDTO } from "../Models/LoginRequestDTO";
import { RefreshTokenRequestDTO } from "../Models/RefreshTokenRequestDTO";
import { VerifyPhoneRequestDTO } from "../Models/VerifyPhoneRequestDTO";
import { SetPasswordRequestDTO } from "../Models/SetPasswordRequestDTO";

export class AuthenticationAssertion {
  private static readonly _current: AuthenticationAssertion = new AuthenticationAssertion();

  public static get Current(): AuthenticationAssertion {
    return AuthenticationAssertion._current;
  }

  private constructor() {}

  public CheckForNullRequest<T>(
    request: T | null | undefined,
    errorMessage: string = AuthenticationConstant.REQUEST_BODY_EMPTY
  ): void {
    if (request === null || request === undefined || typeof request !== "object" || Object.keys(request).length === 0) {
      throw new ValidationCException(errorMessage);
    }
  }

  public AssertLoginRequest(request: LoginRequestDTO | null | undefined): void {
    this.CheckForNullRequest(request, AuthenticationConstant.REQUEST_BODY_EMPTY);

    const validationErrors: string[] = [];

    if (!IndianPhoneCValidator.Current.Validate(request!.PhoneNumber)) {
      validationErrors.push(AuthenticationConstant.PHONE_REQUIRED);
    }

    if (!PasswordCValidator.Current.Validate(request!.Password)) {
      validationErrors.push(AuthenticationConstant.PASSWORD_REQUIRED);
    }

    if (request!.ExpectedRole && !Object.values(UserRoleEnum).includes(request!.ExpectedRole)) {
      validationErrors.push(AuthenticationConstant.INVALID_EXPECTED_ROLE);
    }

    if (validationErrors.length > 0) {
      throw new ValidationCException(validationErrors);
    }
  }

  public AssertRefreshTokenRequest(request: RefreshTokenRequestDTO | null | undefined): void {
    this.CheckForNullRequest(request, AuthenticationConstant.REQUEST_BODY_EMPTY);

    const validationErrors: string[] = [];

    if (!request!.RefreshToken || typeof request!.RefreshToken !== "string" || request!.RefreshToken.trim() === "") {
      validationErrors.push(AuthenticationConstant.REFRESH_TOKEN_REQUIRED);
    }

    if (validationErrors.length > 0) {
      throw new ValidationCException(validationErrors);
    }
  }

  public AssertVerifyPhoneRequest(request: VerifyPhoneRequestDTO | null | undefined): void {
    this.CheckForNullRequest(request, AuthenticationConstant.REQUEST_BODY_EMPTY);

    const validationErrors: string[] = [];

    if (!IndianPhoneCValidator.Current.Validate(request!.PhoneNumber)) {
      validationErrors.push(AuthenticationConstant.PHONE_REQUIRED);
    }

    if (validationErrors.length > 0) {
      throw new ValidationCException(validationErrors);
    }
  }

  public AssertSetPasswordRequest(request: SetPasswordRequestDTO | null | undefined): void {
    this.CheckForNullRequest(request, AuthenticationConstant.REQUEST_BODY_EMPTY);

    const validationErrors: string[] = [];

    if (!IndianPhoneCValidator.Current.Validate(request!.PhoneNumber)) {
      validationErrors.push(AuthenticationConstant.PHONE_REQUIRED);
    }

    if (!PasswordCValidator.Current.Validate(request!.Password)) {
      validationErrors.push(AuthenticationConstant.PASSWORD_REQUIRED);
    }

    if (validationErrors.length > 0) {
      throw new ValidationCException(validationErrors);
    }
  }
}


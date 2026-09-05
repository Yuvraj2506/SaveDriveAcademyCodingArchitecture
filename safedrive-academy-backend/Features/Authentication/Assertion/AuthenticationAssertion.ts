import { ValidationCException } from "../../../Exceptions/ValidationCException";
import { IndianPhoneCValidator } from "../../../Validators/IndianPhoneCValidator";
import { PasswordCValidator } from "../../../Validators/PasswordCValidator";
import { AuthenticationConstant } from "../Constants/AuthenticationConstant";
import { LoginRequestDTO } from "../Models/LoginRequestDTO";

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

    if (validationErrors.length > 0) {
      throw new ValidationCException(validationErrors);
    }
  }
}


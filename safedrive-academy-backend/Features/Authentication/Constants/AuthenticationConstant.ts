export class AuthenticationConstant {
  public static readonly LOGIN_SUCCESS: string = "User logged in successfully.";
  public static readonly INVALID_CREDENTIALS: string = "Invalid phone number or password.";
  public static readonly ACCOUNT_DEACTIVATED: string = "Account is deactivated. Please contact the administrator.";
  public static readonly USER_NOT_FOUND: string = "No user found with the provided phone number.";
  public static readonly PHONE_REQUIRED: string = "Phone number is required and must be a valid 10-digit Indian number.";
  public static readonly PASSWORD_REQUIRED: string = "Password is required and must be at least 8 characters long.";
  public static readonly REQUEST_BODY_EMPTY: string = "Login request body cannot be empty.";
}


export class AuthenticationConstant {
  public static readonly LOGIN_SUCCESS: string = "User logged in successfully.";
  public static readonly INVALID_CREDENTIALS: string = "Invalid phone number or password.";
  public static readonly ACCOUNT_DEACTIVATED: string = "Account is deactivated. Please contact the administrator.";
  public static readonly USER_NOT_FOUND: string = "No user found with the provided phone number.";
  public static readonly PHONE_REQUIRED: string = "Phone number is required and must be a valid 10-digit Indian number.";
  public static readonly PASSWORD_REQUIRED: string = "Password is required and must be at least 8 characters long.";
  public static readonly REQUEST_BODY_EMPTY: string = "Login request body cannot be empty.";
  public static readonly REFRESH_SUCCESS: string = "Token refreshed successfully.";
  public static readonly LOGOUT_SUCCESS: string = "User logged out successfully.";
  public static readonly REFRESH_TOKEN_REQUIRED: string = "Refresh token is required.";
  public static readonly INVALID_OR_EXPIRED_REFRESH_TOKEN: string = "Invalid or expired refresh token.";
  public static readonly REGISTRATION_NOT_FOUND: string = "No registration found for this mobile number. Please register with academy staff.";
  public static readonly REGISTRATION_PENDING_APPROVAL: string = "Your registration request is awaiting Owner approval. Please wait for approval before activating your account.";
  public static readonly REGISTRATION_REJECTED: string = "Your registration request was declined. Please contact academy office.";
  public static readonly PHONE_VERIFIED_SUCCESS: string = "Mobile number verified successfully. Please set your password.";
  public static readonly ACCOUNT_ACTIVATED_SUCCESS: string = "Account activated and password set successfully.";
  public static readonly INVALID_EXPECTED_ROLE: string = "Expected role is invalid. Allowed values are student, admin_staff, or admin_owner.";
  public static readonly STAFF_CANNOT_ACTIVATE_STUDENT: string = "This mobile number is registered as Staff/Owner and cannot be activated via the student portal.";
}


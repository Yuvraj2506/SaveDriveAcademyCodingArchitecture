export class PasswordCValidator {
  private static readonly _current: PasswordCValidator = new PasswordCValidator();
  private static readonly _minimumLength: number = 8;

  public static get Current(): PasswordCValidator {
    return PasswordCValidator._current;
  }

  private constructor() {}

  public Validate(password: string | null | undefined): boolean {
    if (!password || typeof password !== "string") {
      return false;
    }
    return password.length >= PasswordCValidator._minimumLength;
  }
}


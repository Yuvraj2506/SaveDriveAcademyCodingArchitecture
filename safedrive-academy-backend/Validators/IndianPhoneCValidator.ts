export class IndianPhoneCValidator {
  private static readonly _current: IndianPhoneCValidator = new IndianPhoneCValidator();
  private static readonly _phoneRegex: RegExp = /^[6-9]\d{9}$/;

  public static get Current(): IndianPhoneCValidator {
    return IndianPhoneCValidator._current;
  }

  private constructor() {}

  public Validate(phoneNumber: string | null | undefined): boolean {
    if (!phoneNumber || typeof phoneNumber !== "string") {
      return false;
    }
    return IndianPhoneCValidator._phoneRegex.test(phoneNumber.trim());
  }
}


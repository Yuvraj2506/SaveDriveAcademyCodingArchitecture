export abstract class BaseCException extends Error {
  public StatusCode: number;
  public ValidationErrors: string[];

  constructor(message: string, validationErrors: string[] = [], statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.StatusCode = statusCode;
    this.ValidationErrors = validationErrors.length > 0 ? validationErrors : [message];
    Object.setPrototypeOf(this, new.target.prototype);
  }
}


import dotenv from "dotenv";
import { ConfigurationCException } from "../Exceptions/ConfigurationCException";

export class ENValidatorUtility {
  private static readonly _current: ENValidatorUtility = new ENValidatorUtility();
  private _isInitialized: boolean = false;

  public static get Current(): ENValidatorUtility {
    return ENValidatorUtility._current;
  }

  private constructor() {
    this.Initialize();
  }

  private Initialize(): void {
    if (!this._isInitialized) {
      dotenv.config();
      this._isInitialized = true;
    }
  }

  public ValidateAll(): void {
    this.Initialize();
    const requiredVariables: string[] = ["PORT", "MONGODB_URI", "JWT_SECRET", "JWT_EXPIRES_IN"];
    const missingVariables: string[] = [];

    for (const key of requiredVariables) {
      const value = process.env[key];
      if (!value || value.trim() === "") {
        missingVariables.push(key);
      }
    }

    if (missingVariables.length > 0) {
      throw new ConfigurationCException(
        `Missing mandatory environment variables: ${missingVariables.join(", ")}`
      );
    }
  }

  public GetString(key: string, isRequired: boolean = true, defaultValue: string = ""): string {
    this.Initialize();
    const value = process.env[key];
    if (!value || value.trim() === "") {
      if (isRequired) {
        throw new ConfigurationCException(`Environment variable "${key}" is required but not set.`);
      }
      return defaultValue;
    }
    return value.trim();
  }

  public GetNumber(key: string, isRequired: boolean = true, defaultValue: number = 0): number {
    const rawValue = this.GetString(key, isRequired, defaultValue.toString());
    const parsedNumber = Number(rawValue);
    if (isNaN(parsedNumber)) {
      throw new ConfigurationCException(`Environment variable "${key}" must be a valid number.`);
    }
    return parsedNumber;
  }

  public get Port(): number {
    return this.GetNumber("PORT", true, 5000);
  }

  public get MongoDbUri(): string {
    return this.GetString("MONGODB_URI", true);
  }

  public get JwtSecret(): string {
    return this.GetString("JWT_SECRET", true);
  }

  public get JwtExpiresIn(): string {
    return this.GetString("JWT_EXPIRES_IN", false, "7d");
  }
}


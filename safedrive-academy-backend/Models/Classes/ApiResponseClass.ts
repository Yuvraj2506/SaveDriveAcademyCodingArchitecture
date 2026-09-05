export class ApiResponseClass<T> {
  public StatusCode: number;
  public Success: boolean;
  public Message: string;
  public Data: T | null;
  public Errors: string[] | null;
  public Timestamp: string;

  constructor(
    statusCode: number,
    success: boolean,
    message: string,
    data: T | null = null,
    errors: string[] | null = null
  ) {
    this.StatusCode = statusCode;
    this.Success = success;
    this.Message = message;
    this.Data = data;
    this.Errors = errors;
    this.Timestamp = new Date().toISOString();
  }

  public static Succeeded<T>(
    data: T,
    message: string = "Operation succeeded.",
    statusCode: number = 200
  ): ApiResponseClass<T> {
    return new ApiResponseClass<T>(statusCode, true, message, data, null);
  }

  public static Failed<T = null>(
    message: string,
    errors: string[] = [],
    statusCode: number = 400
  ): ApiResponseClass<T> {
    const errorList: string[] = errors.length > 0 ? errors : [message];
    return new ApiResponseClass<T>(statusCode, false, message, null, errorList);
  }
}


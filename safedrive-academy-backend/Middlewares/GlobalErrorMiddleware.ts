import { Request, Response, NextFunction } from "express";
import { BaseCException } from "../Exceptions/BaseCException";
import { ApiResponseClass } from "../Models/Classes/ApiResponseClass";

export class GlobalErrorMiddleware {
  private static readonly _current: GlobalErrorMiddleware = new GlobalErrorMiddleware();

  public static get Current(): GlobalErrorMiddleware {
    return GlobalErrorMiddleware._current;
  }

  private constructor() {}

  public Handle(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    if (error instanceof BaseCException) {
      console.warn(`[BaseCException] ${error.name}: ${error.message} (Status: ${error.StatusCode})`);
      res.status(error.StatusCode).json(
        ApiResponseClass.Failed(error.message, error.ValidationErrors, error.StatusCode)
      );
      return;
    }

    console.error("[UnhandledError]", error);
    res.status(500).json(
      ApiResponseClass.Failed(
        "An unexpected internal server error occurred.",
        [error.message || "Internal server error."],
        500
      )
    );
  }
}


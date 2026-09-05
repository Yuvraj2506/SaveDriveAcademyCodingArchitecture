import { Router, Request, Response } from "express";
import { ApplicationRouteFactory } from "../../Factories/ApplicationRouteFactory";
import { ApiResponseClass } from "../../Models/Classes/ApiResponseClass";
import { BaseCException } from "../../Exceptions/BaseCException";
import { ValidationCException } from "../../Exceptions/ValidationCException";
import { UnauthorizedCException } from "../../Exceptions/UnauthorizedCException";
import { NotFoundCException } from "../../Exceptions/NotFoundCException";
import { AuthenticationAssertion } from "./Assertion/AuthenticationAssertion";
import { AuthenticationService } from "./Services/AuthenticationService";
import { AuthenticationConstant } from "./Constants/AuthenticationConstant";
import { LoginRequestDTO } from "./Models/LoginRequestDTO";
import { LoginResponseDTO } from "./Models/LoginResponseDTO";

export class AuthenticationController {
  private static readonly _current: AuthenticationController = new AuthenticationController();
  private readonly _router: Router;

  public static get Current(): AuthenticationController {
    return AuthenticationController._current;
  }

  private constructor() {
    this._router = Router();
    this.RegisterRoutes();
  }

  public get Router(): Router {
    return this._router;
  }

  private RegisterRoutes(): void {
    this._router.post(
      ApplicationRouteFactory.AuthenticationRoutes.Login,
      this.Login.bind(this)
    );
  }

  public async Login(req: Request, res: Response): Promise<void> {
    try {
      const request: LoginRequestDTO = req.body;

      AuthenticationAssertion.Current.CheckForNullRequest(request);
      AuthenticationAssertion.Current.AssertLoginRequest(request);

      const response: LoginResponseDTO = await AuthenticationService.Current.LoginAsync(request);

      res
        .status(200)
        .json(
          ApiResponseClass.Succeeded<LoginResponseDTO>(
            response,
            AuthenticationConstant.LOGIN_SUCCESS,
            200
          )
        );
    } catch (error: any) {
      if (error instanceof ValidationCException) {
        res
          .status(error.StatusCode)
          .json(
            ApiResponseClass.Failed<null>(
              error.message,
              error.ValidationErrors,
              error.StatusCode
            )
          );
        return;
      }

      if (error instanceof UnauthorizedCException) {
        res
          .status(error.StatusCode)
          .json(
            ApiResponseClass.Failed<null>(
              error.message,
              error.ValidationErrors,
              error.StatusCode
            )
          );
        return;
      }

      if (error instanceof NotFoundCException) {
        res
          .status(error.StatusCode)
          .json(
            ApiResponseClass.Failed<null>(
              error.message,
              error.ValidationErrors,
              error.StatusCode
            )
          );
        return;
      }

      if (error instanceof BaseCException) {
        res
          .status(error.StatusCode)
          .json(
            ApiResponseClass.Failed<null>(
              error.message,
              error.ValidationErrors,
              error.StatusCode
            )
          );
        return;
      }

      console.error("[AuthenticationController] Unexpected error in Login:", error);
      res
        .status(500)
        .json(
          ApiResponseClass.Failed<null>(
            "An unexpected error occurred while processing the login request.",
            [error?.message || "Internal server error."],
            500
          )
        );
    }
  }
}


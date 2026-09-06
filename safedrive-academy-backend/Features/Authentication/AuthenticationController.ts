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
import { RefreshTokenRequestDTO } from "./Models/RefreshTokenRequestDTO";
import { RefreshTokenResponseDTO } from "./Models/RefreshTokenResponseDTO";
import { LogoutRequestDTO } from "./Models/LogoutRequestDTO";
import { VerifyPhoneRequestDTO } from "./Models/VerifyPhoneRequestDTO";
import { VerifyPhoneResponseDTO } from "./Models/VerifyPhoneResponseDTO";
import { SetPasswordRequestDTO } from "./Models/SetPasswordRequestDTO";

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
    this._router.post(
      ApplicationRouteFactory.AuthenticationRoutes.RefreshToken,
      this.RefreshToken.bind(this)
    );
    this._router.post(
      ApplicationRouteFactory.AuthenticationRoutes.Logout,
      this.Logout.bind(this)
    );
    this._router.post(
      ApplicationRouteFactory.AuthenticationRoutes.VerifyPhone,
      this.VerifyPhone.bind(this)
    );
    this._router.post(
      ApplicationRouteFactory.AuthenticationRoutes.SetPassword,
      this.SetPassword.bind(this)
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
      this.HandleError(res, error, "Login");
    }
  }

  public async RefreshToken(req: Request, res: Response): Promise<void> {
    try {
      const request: RefreshTokenRequestDTO = req.body;

      AuthenticationAssertion.Current.AssertRefreshTokenRequest(request);

      const response: RefreshTokenResponseDTO = await AuthenticationService.Current.RefreshTokenAsync(request);

      res
        .status(200)
        .json(
          ApiResponseClass.Succeeded<RefreshTokenResponseDTO>(
            response,
            AuthenticationConstant.REFRESH_SUCCESS,
            200
          )
        );
    } catch (error: any) {
      this.HandleError(res, error, "RefreshToken");
    }
  }

  public async Logout(req: Request, res: Response): Promise<void> {
    try {
      const request: LogoutRequestDTO = req.body || {};
      const authHeader = req.headers.authorization;

      await AuthenticationService.Current.LogoutAsync(request.RefreshToken, authHeader);

      res
        .status(200)
        .json(
          ApiResponseClass.Succeeded<null>(
            null,
            AuthenticationConstant.LOGOUT_SUCCESS,
            200
          )
        );
    } catch (error: any) {
      this.HandleError(res, error, "Logout");
    }
  }

  public async VerifyPhone(req: Request, res: Response): Promise<void> {
    try {
      const request: VerifyPhoneRequestDTO = req.body;

      AuthenticationAssertion.Current.AssertVerifyPhoneRequest(request);

      const response: VerifyPhoneResponseDTO = await AuthenticationService.Current.VerifyPhoneAsync(request);

      res
        .status(200)
        .json(
          ApiResponseClass.Succeeded<VerifyPhoneResponseDTO>(
            response,
            AuthenticationConstant.PHONE_VERIFIED_SUCCESS,
            200
          )
        );
    } catch (error: any) {
      this.HandleError(res, error, "VerifyPhone");
    }
  }

  public async SetPassword(req: Request, res: Response): Promise<void> {
    try {
      const request: SetPasswordRequestDTO = req.body;

      AuthenticationAssertion.Current.AssertSetPasswordRequest(request);

      const response: LoginResponseDTO = await AuthenticationService.Current.SetPasswordAsync(request);

      res
        .status(200)
        .json(
          ApiResponseClass.Succeeded<LoginResponseDTO>(
            response,
            AuthenticationConstant.ACCOUNT_ACTIVATED_SUCCESS,
            200
          )
        );
    } catch (error: any) {
      this.HandleError(res, error, "SetPassword");
    }
  }

  private HandleError(res: Response, error: any, contextName: string): void {
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

    console.error(`[AuthenticationController] Unexpected error in ${contextName}:`, error);
    res
      .status(500)
      .json(
        ApiResponseClass.Failed<null>(
          `An unexpected error occurred while processing the ${contextName} request.`,
          [error?.message || "Internal server error."],
          500
        )
      );
  }
}


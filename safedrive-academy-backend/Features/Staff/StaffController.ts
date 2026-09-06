import { Router, Request, Response } from "express";
import { ApiResponseClass } from "../../Models/Classes/ApiResponseClass";
import { BaseCException } from "../../Exceptions/BaseCException";
import { ValidationCException } from "../../Exceptions/ValidationCException";
import { UnauthorizedCException } from "../../Exceptions/UnauthorizedCException";
import { NotFoundCException } from "../../Exceptions/NotFoundCException";
import { AuthenticatedRequest } from "../../Middlewares/AuthRoleMiddleware";
import { StaffAssertion } from "./Assertion/StaffAssertion";
import { StaffService } from "./Services/StaffService";
import { StaffConstant } from "./Constants/StaffConstant";
import { CreateStudentRequestDTO } from "./Models/CreateStudentRequestDTO";
import { StaffStudentResponseDTO } from "./Models/StaffStudentResponseDTO";

export class StaffController {
  private static readonly _current: StaffController = new StaffController();
  private readonly _router: Router;

  public static get Current(): StaffController {
    return StaffController._current;
  }

  private constructor() {
    this._router = Router();
    this.RegisterRoutes();
  }

  public get Router(): Router {
    return this._router;
  }

  private RegisterRoutes(): void {
    this._router.post("/student-requests", this.CreateStudentRequest.bind(this));
    this._router.get("/student-requests", this.GetStudentRequests.bind(this));
    this._router.get("/students", this.GetApprovedStudents.bind(this));
    this._router.patch("/students/:id/km", this.UpdateStudentKm.bind(this));
    this._router.patch("/students/:id/days", this.UpdateStudentDays.bind(this));
  }

  public async CreateStudentRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const request: CreateStudentRequestDTO = req.body;

      StaffAssertion.Current.CheckForNullRequest(request);
      StaffAssertion.Current.AssertCreateStudentRequest(request);

      const staffName = req.body.RequestedBy || "Ramesh Kumar (Staff)";
      const response: StaffStudentResponseDTO = await StaffService.Current.CreateStudentRequestAsync(
        request,
        staffName
      );

      res
        .status(201)
        .json(
          ApiResponseClass.Succeeded<StaffStudentResponseDTO>(
            response,
            StaffConstant.STUDENT_REQUEST_CREATED,
            201
          )
        );
    } catch (error: any) {
      this.HandleError(res, error, "CreateStudentRequest");
    }
  }

  public async GetStudentRequests(req: Request, res: Response): Promise<void> {
    try {
      const response: StaffStudentResponseDTO[] = await StaffService.Current.GetStudentRequestsAsync();

      res
        .status(200)
        .json(
          ApiResponseClass.Succeeded<StaffStudentResponseDTO[]>(
            response,
            StaffConstant.STUDENT_REQUESTS_FETCHED,
            200
          )
        );
    } catch (error: any) {
      this.HandleError(res, error, "GetStudentRequests");
    }
  }

  public async GetApprovedStudents(req: Request, res: Response): Promise<void> {
    try {
      const response: StaffStudentResponseDTO[] = await StaffService.Current.GetApprovedStudentsAsync();

      res
        .status(200)
        .json(
          ApiResponseClass.Succeeded<StaffStudentResponseDTO[]>(
            response,
            StaffConstant.APPROVED_STUDENTS_FETCHED,
            200
          )
        );
    } catch (error: any) {
      this.HandleError(res, error, "GetApprovedStudents");
    }
  }

  public async UpdateStudentKm(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { CompletedKm } = req.body;

      if (CompletedKm === undefined || typeof CompletedKm !== "number") {
        throw new ValidationCException("CompletedKm is required and must be a number.");
      }

      const response: StaffStudentResponseDTO = await StaffService.Current.UpdateStudentKmAsync(
        id,
        CompletedKm
      );

      res
        .status(200)
        .json(
          ApiResponseClass.Succeeded<StaffStudentResponseDTO>(
            response,
            StaffConstant.PROGRESS_UPDATED,
            200
          )
        );
    } catch (error: any) {
      this.HandleError(res, error, "UpdateStudentKm");
    }
  }

  public async UpdateStudentDays(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { CompletedDays } = req.body;

      if (CompletedDays === undefined || typeof CompletedDays !== "number") {
        throw new ValidationCException("CompletedDays is required and must be a number.");
      }

      const response: StaffStudentResponseDTO = await StaffService.Current.UpdateStudentDaysAsync(
        id,
        CompletedDays
      );

      res
        .status(200)
        .json(
          ApiResponseClass.Succeeded<StaffStudentResponseDTO>(
            response,
            StaffConstant.PROGRESS_UPDATED,
            200
          )
        );
    } catch (error: any) {
      this.HandleError(res, error, "UpdateStudentDays");
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

    console.error(`[StaffController] Unexpected error in ${contextName}:`, error);
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

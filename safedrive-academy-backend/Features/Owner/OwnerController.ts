import { Router, Request, Response } from "express";
import { ApiResponseClass } from "../../Models/Classes/ApiResponseClass";
import { BaseCException } from "../../Exceptions/BaseCException";
import { ValidationCException } from "../../Exceptions/ValidationCException";
import { UnauthorizedCException } from "../../Exceptions/UnauthorizedCException";
import { NotFoundCException } from "../../Exceptions/NotFoundCException";
import { AuthenticatedRequest } from "../../Middlewares/AuthRoleMiddleware";
import { OwnerAssertion } from "./Assertion/OwnerAssertion";
import { OwnerService } from "./Services/OwnerService";
import { OwnerConstant } from "./Constants/OwnerConstant";
import { RejectStudentRequestDTO } from "./Models/RejectStudentRequestDTO";
import { UpdateStudentTargetDTO } from "./Models/UpdateStudentTargetDTO";
import { OwnerStudentResponseDTO } from "./Models/OwnerStudentResponseDTO";

export class OwnerController {
  private static readonly _current: OwnerController = new OwnerController();
  private readonly _router: Router;

  public static get Current(): OwnerController {
    return OwnerController._current;
  }

  private constructor() {
    this._router = Router();
    this.RegisterRoutes();
  }

  public get Router(): Router {
    return this._router;
  }

  private RegisterRoutes(): void {
    this._router.get("/student-requests", this.GetAllStudentRequests.bind(this));
    this._router.post("/student-requests/:id/approve", this.ApproveStudentRequest.bind(this));
    this._router.post("/student-requests/:id/reject", this.RejectStudentRequest.bind(this));
    this._router.get("/students", this.GetAllStudents.bind(this));
    this._router.patch("/students/:id", this.UpdateStudentTarget.bind(this));
    this._router.delete("/students/:id", this.DeleteStudent.bind(this));
  }

  public async GetAllStudentRequests(req: Request, res: Response): Promise<void> {
    try {
      const response: OwnerStudentResponseDTO[] = await OwnerService.Current.GetAllStudentRequestsAsync();

      res
        .status(200)
        .json(
          ApiResponseClass.Succeeded<OwnerStudentResponseDTO[]>(
            response,
            OwnerConstant.ALL_REQUESTS_FETCHED,
            200
          )
        );
    } catch (error: any) {
      this.HandleError(res, error, "GetAllStudentRequests");
    }
  }

  public async ApproveStudentRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const ownerName = req.body?.ApprovedBy || "Yuvraj Gupta (Owner)";

      const response: OwnerStudentResponseDTO = await OwnerService.Current.ApproveStudentRequestAsync(
        id,
        ownerName
      );

      res
        .status(200)
        .json(
          ApiResponseClass.Succeeded<OwnerStudentResponseDTO>(
            response,
            OwnerConstant.REQUEST_APPROVED,
            200
          )
        );
    } catch (error: any) {
      this.HandleError(res, error, "ApproveStudentRequest");
    }
  }

  public async RejectStudentRequest(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const request: RejectStudentRequestDTO = req.body || {};

      OwnerAssertion.Current.AssertRejectStudentRequest(request);

      const response: OwnerStudentResponseDTO = await OwnerService.Current.RejectStudentRequestAsync(
        id,
        request
      );

      res
        .status(200)
        .json(
          ApiResponseClass.Succeeded<OwnerStudentResponseDTO>(
            response,
            OwnerConstant.REQUEST_REJECTED,
            200
          )
        );
    } catch (error: any) {
      this.HandleError(res, error, "RejectStudentRequest");
    }
  }

  public async GetAllStudents(req: Request, res: Response): Promise<void> {
    try {
      const response: OwnerStudentResponseDTO[] = await OwnerService.Current.GetAllStudentsAsync();

      res
        .status(200)
        .json(
          ApiResponseClass.Succeeded<OwnerStudentResponseDTO[]>(
            response,
            OwnerConstant.ALL_STUDENTS_FETCHED,
            200
          )
        );
    } catch (error: any) {
      this.HandleError(res, error, "GetAllStudents");
    }
  }

  public async UpdateStudentTarget(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const request: UpdateStudentTargetDTO = req.body;

      OwnerAssertion.Current.AssertUpdateStudentTargetRequest(request);

      const response: OwnerStudentResponseDTO = await OwnerService.Current.UpdateStudentTargetAsync(
        id,
        request
      );

      res
        .status(200)
        .json(
          ApiResponseClass.Succeeded<OwnerStudentResponseDTO>(
            response,
            OwnerConstant.STUDENT_UPDATED,
            200
          )
        );
    } catch (error: any) {
      this.HandleError(res, error, "UpdateStudentTarget");
    }
  }

  public async DeleteStudent(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);

      const success: boolean = await OwnerService.Current.DeleteStudentAsync(id);

      if (!success) {
        throw new NotFoundCException(OwnerConstant.STUDENT_NOT_FOUND);
      }

      res
        .status(200)
        .json(
          ApiResponseClass.Succeeded<boolean>(
            true,
            OwnerConstant.STUDENT_DELETED,
            200
          )
        );
    } catch (error: any) {
      this.HandleError(res, error, "DeleteStudent");
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

    console.error(`[OwnerController] Unexpected error in ${contextName}:`, error);
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

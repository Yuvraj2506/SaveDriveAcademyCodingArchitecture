import { ValidationCException } from "../../../Exceptions/ValidationCException";
import { OwnerConstant } from "../Constants/OwnerConstant";
import { RejectStudentRequestDTO } from "../Models/RejectStudentRequestDTO";
import { UpdateStudentTargetDTO } from "../Models/UpdateStudentTargetDTO";

export class OwnerAssertion {
  private static readonly _current: OwnerAssertion = new OwnerAssertion();

  public static get Current(): OwnerAssertion {
    return OwnerAssertion._current;
  }

  private constructor() {}

  public CheckForNullRequest<T>(
    request: T | null | undefined,
    errorMessage: string = OwnerConstant.REQUEST_BODY_EMPTY
  ): void {
    if (request === null || request === undefined || typeof request !== "object" || Object.keys(request).length === 0) {
      throw new ValidationCException(errorMessage);
    }
  }

  public AssertRejectStudentRequest(request: RejectStudentRequestDTO | null | undefined): void {
    // Rejection reason is optional
  }

  public AssertUpdateStudentTargetRequest(request: UpdateStudentTargetDTO | null | undefined): void {
    this.CheckForNullRequest(request, OwnerConstant.REQUEST_BODY_EMPTY);

    const validationErrors: string[] = [];

    if (request!.TargetKm !== undefined && (typeof request!.TargetKm !== "number" || request!.TargetKm < 0)) {
      validationErrors.push("Target kilometers must be a non-negative number.");
    }

    if (request!.TotalDays !== undefined && (typeof request!.TotalDays !== "number" || request!.TotalDays < 0)) {
      validationErrors.push("Total days must be a non-negative number.");
    }

    if (validationErrors.length > 0) {
      throw new ValidationCException(validationErrors);
    }
  }
}

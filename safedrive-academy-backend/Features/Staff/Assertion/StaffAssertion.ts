import { ValidationCException } from "../../../Exceptions/ValidationCException";
import { IndianPhoneCValidator } from "../../../Validators/IndianPhoneCValidator";
import { StaffConstant } from "../Constants/StaffConstant";
import { CreateStudentRequestDTO } from "../Models/CreateStudentRequestDTO";
import { UpdateStudentProgressDTO } from "../Models/UpdateStudentProgressDTO";

export class StaffAssertion {
  private static readonly _current: StaffAssertion = new StaffAssertion();

  public static get Current(): StaffAssertion {
    return StaffAssertion._current;
  }

  private constructor() {}

  public CheckForNullRequest<T>(
    request: T | null | undefined,
    errorMessage: string = StaffConstant.REQUEST_BODY_EMPTY
  ): void {
    if (request === null || request === undefined || typeof request !== "object" || Object.keys(request).length === 0) {
      throw new ValidationCException(errorMessage);
    }
  }

  public AssertCreateStudentRequest(request: CreateStudentRequestDTO | null | undefined): void {
    this.CheckForNullRequest(request, StaffConstant.REQUEST_BODY_EMPTY);

    const validationErrors: string[] = [];

    if (!request!.Name || typeof request!.Name !== "string" || request!.Name.trim() === "") {
      validationErrors.push(StaffConstant.NAME_REQUIRED);
    }

    if (!IndianPhoneCValidator.Current.Validate(request!.PhoneNumber)) {
      validationErrors.push(StaffConstant.PHONE_REQUIRED);
    }

    if (!request!.CoursePackage || typeof request!.CoursePackage !== "string" || request!.CoursePackage.trim() === "") {
      validationErrors.push(StaffConstant.COURSE_REQUIRED);
    }

    if (validationErrors.length > 0) {
      throw new ValidationCException(validationErrors);
    }
  }

  public AssertUpdateProgressRequest(request: UpdateStudentProgressDTO | null | undefined): void {
    this.CheckForNullRequest(request, StaffConstant.REQUEST_BODY_EMPTY);

    const validationErrors: string[] = [];

    if (request!.CompletedKm !== undefined && (typeof request!.CompletedKm !== "number" || request!.CompletedKm < 0)) {
      validationErrors.push("Completed kilometers must be a non-negative number.");
    }

    if (request!.CompletedDays !== undefined && (typeof request!.CompletedDays !== "number" || request!.CompletedDays < 0)) {
      validationErrors.push("Completed days must be a non-negative number.");
    }

    if (validationErrors.length > 0) {
      throw new ValidationCException(validationErrors);
    }
  }
}

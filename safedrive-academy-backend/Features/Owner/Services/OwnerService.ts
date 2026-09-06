import { StudentModel, IStudentDocument, StudentRequestStatusEnum } from "../../../Models/StudentModel";
import { UserModel } from "../../Authentication/Models/UserModel";
import { NotFoundCException } from "../../../Exceptions/NotFoundCException";
import { OwnerConstant } from "../Constants/OwnerConstant";
import { RejectStudentRequestDTO } from "../Models/RejectStudentRequestDTO";
import { UpdateStudentTargetDTO } from "../Models/UpdateStudentTargetDTO";
import { OwnerStudentResponseDTO } from "../Models/OwnerStudentResponseDTO";

export class OwnerService {
  private static readonly _current: OwnerService = new OwnerService();

  public static get Current(): OwnerService {
    return OwnerService._current;
  }

  private constructor() {}

  private MapToDTO(student: IStudentDocument): OwnerStudentResponseDTO {
    return {
      Id: student._id.toString(),
      Name: student.Name,
      PhoneNumber: student.PhoneNumber,
      VehicleType: student.VehicleType,
      CoursePackage: student.CoursePackage,
      TrainingType: student.TrainingType,
      TargetKm: student.TargetKm,
      CompletedKm: student.CompletedKm,
      TotalDays: student.TotalDays,
      CompletedDays: student.CompletedDays,
      TotalCourseFee: student.TotalCourseFee,
      TotalPaid: student.TotalPaid,
      RemainingDue: student.RemainingDue,
      AssignedInstructor: student.AssignedInstructor,
      PaymentMethod: student.PaymentMethod,
      RequestedBy: student.RequestedBy,
      RequestedDate: student.RequestedDate,
      ApprovedBy: student.ApprovedBy,
      ApprovedDate: student.ApprovedDate,
      RejectionReason: student.RejectionReason,
      Status: student.Status,
      Payments: student.Payments || []
    };
  }

  private GetQuery(idOrPhone: string) {
    return idOrPhone.length === 24 && /^[0-9a-fA-F]{24}$/.test(idOrPhone)
      ? { _id: idOrPhone }
      : { PhoneNumber: idOrPhone.trim() };
  }

  public async GetAllStudentRequestsAsync(): Promise<OwnerStudentResponseDTO[]> {
    const requests: IStudentDocument[] = await StudentModel.find().sort({ CreatedAt: -1 }).exec();
    return requests.map((r) => this.MapToDTO(r));
  }

  public async ApproveStudentRequestAsync(
    idOrPhone: string,
    ownerName: string = "Owner Administrator"
  ): Promise<OwnerStudentResponseDTO> {
    const student: IStudentDocument | null = await StudentModel.findOne(this.GetQuery(idOrPhone)).exec();

    if (!student) {
      throw new NotFoundCException(OwnerConstant.STUDENT_NOT_FOUND);
    }

    const today = new Date().toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    student.Status = StudentRequestStatusEnum.Approved;
    student.ApprovedBy = ownerName;
    student.ApprovedDate = today;
    student.RejectionReason = null;

    await student.save();
    return this.MapToDTO(student);
  }

  public async RejectStudentRequestAsync(
    idOrPhone: string,
    request?: RejectStudentRequestDTO
  ): Promise<OwnerStudentResponseDTO> {
    const student: IStudentDocument | null = await StudentModel.findOne(this.GetQuery(idOrPhone)).exec();

    if (!student) {
      throw new NotFoundCException(OwnerConstant.STUDENT_NOT_FOUND);
    }

    student.Status = StudentRequestStatusEnum.Rejected;
    student.RejectionReason = request?.RejectionReason?.trim() || "Registration request declined by academy owner.";

    await student.save();
    return this.MapToDTO(student);
  }

  public async GetAllStudentsAsync(): Promise<OwnerStudentResponseDTO[]> {
    const students: IStudentDocument[] = await StudentModel.find({
      Status: StudentRequestStatusEnum.Approved
    })
      .sort({ CreatedAt: -1 })
      .exec();

    return students.map((s) => this.MapToDTO(s));
  }

  public async UpdateStudentTargetAsync(
    idOrPhone: string,
    updates: UpdateStudentTargetDTO
  ): Promise<OwnerStudentResponseDTO> {
    const student: IStudentDocument | null = await StudentModel.findOne(this.GetQuery(idOrPhone)).exec();

    if (!student) {
      throw new NotFoundCException(OwnerConstant.STUDENT_NOT_FOUND);
    }

    if (updates.TargetKm !== undefined) student.TargetKm = updates.TargetKm;
    if (updates.TotalDays !== undefined) student.TotalDays = updates.TotalDays;
    if (updates.TotalCourseFee !== undefined) student.TotalCourseFee = updates.TotalCourseFee;
    if (updates.RemainingDue !== undefined) student.RemainingDue = updates.RemainingDue;

    await student.save();
    return this.MapToDTO(student);
  }

  public async DeleteStudentAsync(idOrPhone: string): Promise<boolean> {
    const query = this.GetQuery(idOrPhone);
    const student: IStudentDocument | null = await StudentModel.findOneAndDelete(query).exec();

    if (student) {
      await UserModel.findOneAndDelete({ PhoneNumber: student.PhoneNumber }).exec();
      return true;
    }

    return false;
  }
}

import { StudentModel, IStudentDocument, StudentRequestStatusEnum } from "../../../Models/StudentModel";
import { NotFoundCException } from "../../../Exceptions/NotFoundCException";
import { StaffConstant } from "../Constants/StaffConstant";
import { CreateStudentRequestDTO } from "../Models/CreateStudentRequestDTO";
import { StaffStudentResponseDTO } from "../Models/StaffStudentResponseDTO";

export class StaffService {
  private static readonly _current: StaffService = new StaffService();

  public static get Current(): StaffService {
    return StaffService._current;
  }

  private constructor() {}

  private MapToDTO(student: IStudentDocument): StaffStudentResponseDTO {
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
      Status: student.Status,
      ApprovedBy: student.ApprovedBy,
      ApprovedDate: student.ApprovedDate,
      RejectionReason: student.RejectionReason
    };
  }

  public async CreateStudentRequestAsync(
    request: CreateStudentRequestDTO,
    staffName: string = "Staff Member"
  ): Promise<StaffStudentResponseDTO> {
    const normalizedPhone = request.PhoneNumber.trim();
    const today = new Date().toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    const receiptNum = `REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const initialPayments =
      request.TotalPaid > 0
        ? [
            {
              ReceiptNumber: receiptNum,
              Date: today,
              Method: request.PaymentMethod || "UPI",
              Amount: request.TotalPaid,
              RecordedBy: staffName
            }
          ]
        : [];

    const student: IStudentDocument = new StudentModel({
      Name: request.Name.trim(),
      PhoneNumber: normalizedPhone,
      VehicleType: request.VehicleType || "4-Wheeler",
      CoursePackage: request.CoursePackage,
      TrainingType: request.TrainingType || "4w_personal",
      TargetKm: request.TargetKm || (request.VehicleType === "4-Wheeler" ? 120 : 0),
      CompletedKm: 0,
      TotalDays: request.TotalDays || 15,
      CompletedDays: 0,
      TotalCourseFee: request.TotalCourseFee || 0,
      TotalPaid: request.TotalPaid || 0,
      RemainingDue: request.RemainingDue || 0,
      AssignedInstructor: request.AssignedInstructor || staffName,
      PaymentMethod: request.PaymentMethod || "UPI",
      RequestedBy: staffName,
      RequestedDate: today,
      Status: StudentRequestStatusEnum.Pending,
      Payments: initialPayments
    });

    await student.save();
    return this.MapToDTO(student);
  }

  public async GetStudentRequestsAsync(): Promise<StaffStudentResponseDTO[]> {
    const students: IStudentDocument[] = await StudentModel.find().sort({ CreatedAt: -1 }).exec();
    return students.map((s) => this.MapToDTO(s));
  }

  public async GetApprovedStudentsAsync(): Promise<StaffStudentResponseDTO[]> {
    const students: IStudentDocument[] = await StudentModel.find({
      Status: StudentRequestStatusEnum.Approved
    })
      .sort({ CreatedAt: -1 })
      .exec();

    return students.map((s) => this.MapToDTO(s));
  }

  public async UpdateStudentKmAsync(idOrPhone: string, completedKm: number): Promise<StaffStudentResponseDTO> {
    const query = idOrPhone.length === 24 && /^[0-9a-fA-F]{24}$/.test(idOrPhone)
      ? { _id: idOrPhone }
      : { PhoneNumber: idOrPhone.trim() };

    const student: IStudentDocument | null = await StudentModel.findOneAndUpdate(
      query,
      { $set: { CompletedKm: completedKm } },
      { new: true }
    ).exec();

    if (!student) {
      throw new NotFoundCException(StaffConstant.STUDENT_NOT_FOUND);
    }

    return this.MapToDTO(student);
  }

  public async UpdateStudentDaysAsync(idOrPhone: string, completedDays: number): Promise<StaffStudentResponseDTO> {
    const query = idOrPhone.length === 24 && /^[0-9a-fA-F]{24}$/.test(idOrPhone)
      ? { _id: idOrPhone }
      : { PhoneNumber: idOrPhone.trim() };

    const student: IStudentDocument | null = await StudentModel.findOneAndUpdate(
      query,
      { $set: { CompletedDays: completedDays } },
      { new: true }
    ).exec();

    if (!student) {
      throw new NotFoundCException(StaffConstant.STUDENT_NOT_FOUND);
    }

    return this.MapToDTO(student);
  }
}

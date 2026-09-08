import { StudentModel, IStudentDocument, StudentRequestStatusEnum } from "../../../Models/StudentModel";
import { UserModel } from "../../Authentication/Models/UserModel";
import { NotFoundCException } from "../../../Exceptions/NotFoundCException";
import { OwnerConstant } from "../Constants/OwnerConstant";
import { RejectStudentRequestDTO } from "../Models/RejectStudentRequestDTO";
import { UpdateStudentTargetDTO } from "../Models/UpdateStudentTargetDTO";
import { OwnerStudentResponseDTO } from "../Models/OwnerStudentResponseDTO";

import { ReenrollStudentDTO } from "../Models/ReenrollStudentDTO";

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
      Payments: student.Payments || [],
      CourseHistory: student.CourseHistory || [],
      IsInactive: student.IsInactive || false,
      IsDeleted: student.IsDeleted || false,
      DeletedAt: student.DeletedAt || null
    };
  }

  private GetQuery(idOrPhone: string) {
    return idOrPhone.length === 24 && /^[0-9a-fA-F]{24}$/.test(idOrPhone)
      ? { _id: idOrPhone }
      : { PhoneNumber: idOrPhone.trim() };
  }

  public async GetAllStudentRequestsAsync(): Promise<OwnerStudentResponseDTO[]> {
    const requests: IStudentDocument[] = await StudentModel.find({
      IsDeleted: { $ne: true }
    })
      .sort({ CreatedAt: -1 })
      .exec();
    return requests.map((r) => this.MapToDTO(r));
  }

  public async ApproveStudentRequestAsync(
    idOrPhone: string,
    ownerName: string = "Owner Administrator"
  ): Promise<OwnerStudentResponseDTO> {
    const student: IStudentDocument | null = await StudentModel.findOne({
      ...this.GetQuery(idOrPhone),
      IsDeleted: { $ne: true }
    }).exec();

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
    const student: IStudentDocument | null = await StudentModel.findOne({
      ...this.GetQuery(idOrPhone),
      IsDeleted: { $ne: true }
    }).exec();

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
      Status: StudentRequestStatusEnum.Approved,
      IsDeleted: { $ne: true }
    })
      .sort({ CreatedAt: -1 })
      .exec();

    return students.map((s) => this.MapToDTO(s));
  }

  public async UpdateStudentTargetAsync(
    idOrPhone: string,
    updates: UpdateStudentTargetDTO
  ): Promise<OwnerStudentResponseDTO> {
    const student: IStudentDocument | null = await StudentModel.findOne({
      ...this.GetQuery(idOrPhone),
      IsDeleted: { $ne: true }
    }).exec();

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
    const now = new Date();

    const student: IStudentDocument | null = await StudentModel.findOne(query).exec();
    if (!student) {
      return false;
    }

    // Soft delete all student records and requests associated with this phone
    await StudentModel.updateMany(
      { PhoneNumber: student.PhoneNumber },
      { $set: { IsDeleted: true, DeletedAt: now } }
    ).exec();

    // Deactivate user login
    await UserModel.updateMany(
      { PhoneNumber: student.PhoneNumber },
      { $set: { IsActive: false } }
    ).exec();

    return true;
  }

  public async GetArchivedStudentsAsync(): Promise<OwnerStudentResponseDTO[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Auto purge records older than 30 days
    const expiredStudents = await StudentModel.find({
      IsDeleted: true,
      DeletedAt: { $lt: thirtyDaysAgo }
    }).exec();

    if (expiredStudents.length > 0) {
      const expiredPhones = expiredStudents.map((s) => s.PhoneNumber);
      await StudentModel.deleteMany({ PhoneNumber: { $in: expiredPhones }, IsDeleted: true }).exec();
      await UserModel.deleteMany({ PhoneNumber: { $in: expiredPhones } }).exec();
    }

    const archived: IStudentDocument[] = await StudentModel.find({
      IsDeleted: true
    })
      .sort({ DeletedAt: -1 })
      .exec();

    return archived.map((s) => this.MapToDTO(s));
  }

  public async RestoreStudentAsync(idOrPhone: string): Promise<OwnerStudentResponseDTO> {
    const query = this.GetQuery(idOrPhone);

    const student: IStudentDocument | null = await StudentModel.findOne(query).exec();
    if (!student) {
      throw new NotFoundCException(OwnerConstant.STUDENT_NOT_FOUND);
    }

    // Restore all student records and requests associated with this phone
    await StudentModel.updateMany(
      { PhoneNumber: student.PhoneNumber },
      { $set: { IsDeleted: false, DeletedAt: null } }
    ).exec();

    // Reactivate user login
    await UserModel.updateMany(
      { PhoneNumber: student.PhoneNumber },
      { $set: { IsActive: true } }
    ).exec();

    const updated = await StudentModel.findOne(query).exec();
    return this.MapToDTO(updated || student);
  }

  public async ReenrollStudentAsync(
    idOrPhone: string,
    payload: ReenrollStudentDTO,
    ownerName: string = "Owner Administrator"
  ): Promise<OwnerStudentResponseDTO> {
    const query = this.GetQuery(idOrPhone);
    const student: IStudentDocument | null = await StudentModel.findOne({
      ...query,
      IsDeleted: { $ne: true }
    }).exec();

    if (!student) {
      throw new NotFoundCException(OwnerConstant.STUDENT_NOT_FOUND);
    }

    const today = new Date().toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    // 1. Archive current course to CourseHistory
    if (!student.CourseHistory) {
      student.CourseHistory = [];
    }
    student.CourseHistory.push({
      CoursePackage: student.CoursePackage,
      VehicleType: student.VehicleType,
      TrainingType: student.TrainingType,
      TargetKm: student.TargetKm || 0,
      CompletedKm: student.CompletedKm || 0,
      TotalDays: student.TotalDays || 0,
      CompletedDays: student.CompletedDays || 0,
      Fee: student.TotalCourseFee || 0,
      EnrolledDate: student.ApprovedDate || student.RequestedDate || today,
      CompletedDate: today,
      AssignedInstructor: student.AssignedInstructor || "Desk Instructor"
    });

    // 2. Set new course details & reset metrics for new batch
    student.VehicleType = payload.VehicleType || "4-Wheeler";
    student.CoursePackage = payload.CoursePackage;
    student.TrainingType = payload.TrainingType || "4w_personal";
    student.TargetKm = payload.TargetKm !== undefined ? payload.TargetKm : (payload.VehicleType === "4-Wheeler" ? 120 : 0);
    student.TotalDays = payload.TotalDays !== undefined ? payload.TotalDays : (payload.VehicleType === "2-Wheeler" ? 15 : 0);
    student.CompletedKm = 0;
    student.CompletedDays = 0;
    if (payload.AssignedInstructor) {
      student.AssignedInstructor = payload.AssignedInstructor;
    }

    // 3. Accumulate financials & add new payment receipt if provided
    student.TotalCourseFee = (student.TotalCourseFee || 0) + (payload.NewCourseFee || 0);
    student.TotalPaid = (student.TotalPaid || 0) + (payload.InitialPayment || 0);
    student.RemainingDue = Math.max(
      0,
      (student.RemainingDue || 0) + ((payload.NewCourseFee || 0) - (payload.InitialPayment || 0))
    );

    if (payload.InitialPayment > 0) {
      const receiptNum = `REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      if (!student.Payments) {
        student.Payments = [];
      }
      student.Payments.push({
        ReceiptNumber: receiptNum,
        Date: today,
        Method: payload.PaymentMethod || "UPI",
        Amount: payload.InitialPayment,
        RecordedBy: ownerName,
        ReferenceNote: payload.ReferenceNote || `Re-enrollment: ${payload.CoursePackage}`
      });
    }

    student.ApprovedDate = today;
    student.ApprovedBy = ownerName;
    student.IsInactive = false;
    student.Status = StudentRequestStatusEnum.Approved;

    await student.save();
    return this.MapToDTO(student);
  }

  public async PermanentlyDeleteStudentAsync(idOrPhone: string): Promise<boolean> {
    const query = this.GetQuery(idOrPhone);
    const student = await StudentModel.findOne(query).exec();
    if (!student) {
      return false;
    }

    await StudentModel.deleteMany({ PhoneNumber: student.PhoneNumber }).exec();
    await UserModel.deleteMany({ PhoneNumber: student.PhoneNumber }).exec();
    return true;
  }
}

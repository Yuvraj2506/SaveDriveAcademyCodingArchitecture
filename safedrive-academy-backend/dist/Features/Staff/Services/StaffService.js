"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffService = void 0;
const StudentModel_1 = require("../../../Models/StudentModel");
const NotFoundCException_1 = require("../../../Exceptions/NotFoundCException");
const StaffConstant_1 = require("../Constants/StaffConstant");
class StaffService {
    static _current = new StaffService();
    static get Current() {
        return StaffService._current;
    }
    constructor() { }
    MapToDTO(student) {
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
    async CreateStudentRequestAsync(request, staffName = "Staff Member") {
        const normalizedPhone = request.PhoneNumber.trim();
        const today = new Date().toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
        const receiptNum = `REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
        const initialPayments = request.TotalPaid > 0
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
        const student = new StudentModel_1.StudentModel({
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
            Status: StudentModel_1.StudentRequestStatusEnum.Pending,
            Payments: initialPayments
        });
        await student.save();
        return this.MapToDTO(student);
    }
    async GetStudentRequestsAsync() {
        const students = await StudentModel_1.StudentModel.find().sort({ CreatedAt: -1 }).exec();
        return students.map((s) => this.MapToDTO(s));
    }
    async GetApprovedStudentsAsync() {
        const students = await StudentModel_1.StudentModel.find({
            Status: StudentModel_1.StudentRequestStatusEnum.Approved
        })
            .sort({ CreatedAt: -1 })
            .exec();
        return students.map((s) => this.MapToDTO(s));
    }
    async UpdateStudentKmAsync(idOrPhone, completedKm) {
        const query = idOrPhone.length === 24 && /^[0-9a-fA-F]{24}$/.test(idOrPhone)
            ? { _id: idOrPhone }
            : { PhoneNumber: idOrPhone.trim() };
        const student = await StudentModel_1.StudentModel.findOneAndUpdate(query, { $set: { CompletedKm: completedKm } }, { new: true }).exec();
        if (!student) {
            throw new NotFoundCException_1.NotFoundCException(StaffConstant_1.StaffConstant.STUDENT_NOT_FOUND);
        }
        return this.MapToDTO(student);
    }
    async UpdateStudentDaysAsync(idOrPhone, completedDays) {
        const query = idOrPhone.length === 24 && /^[0-9a-fA-F]{24}$/.test(idOrPhone)
            ? { _id: idOrPhone }
            : { PhoneNumber: idOrPhone.trim() };
        const student = await StudentModel_1.StudentModel.findOneAndUpdate(query, { $set: { CompletedDays: completedDays } }, { new: true }).exec();
        if (!student) {
            throw new NotFoundCException_1.NotFoundCException(StaffConstant_1.StaffConstant.STUDENT_NOT_FOUND);
        }
        return this.MapToDTO(student);
    }
}
exports.StaffService = StaffService;

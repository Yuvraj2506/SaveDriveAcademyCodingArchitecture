"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnerService = void 0;
const StudentModel_1 = require("../../../Models/StudentModel");
const UserModel_1 = require("../../Authentication/Models/UserModel");
const NotFoundCException_1 = require("../../../Exceptions/NotFoundCException");
const OwnerConstant_1 = require("../Constants/OwnerConstant");
class OwnerService {
    static _current = new OwnerService();
    static get Current() {
        return OwnerService._current;
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
    GetQuery(idOrPhone) {
        return idOrPhone.length === 24 && /^[0-9a-fA-F]{24}$/.test(idOrPhone)
            ? { _id: idOrPhone }
            : { PhoneNumber: idOrPhone.trim() };
    }
    async GetAllStudentRequestsAsync() {
        const requests = await StudentModel_1.StudentModel.find({
            IsDeleted: { $ne: true }
        })
            .sort({ CreatedAt: -1 })
            .exec();
        return requests.map((r) => this.MapToDTO(r));
    }
    async ApproveStudentRequestAsync(idOrPhone, ownerName = "Owner Administrator") {
        const student = await StudentModel_1.StudentModel.findOne({
            ...this.GetQuery(idOrPhone),
            IsDeleted: { $ne: true }
        }).exec();
        if (!student) {
            throw new NotFoundCException_1.NotFoundCException(OwnerConstant_1.OwnerConstant.STUDENT_NOT_FOUND);
        }
        const today = new Date().toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
        student.Status = StudentModel_1.StudentRequestStatusEnum.Approved;
        student.ApprovedBy = ownerName;
        student.ApprovedDate = today;
        student.RejectionReason = null;
        await student.save();
        return this.MapToDTO(student);
    }
    async RejectStudentRequestAsync(idOrPhone, request) {
        const student = await StudentModel_1.StudentModel.findOne({
            ...this.GetQuery(idOrPhone),
            IsDeleted: { $ne: true }
        }).exec();
        if (!student) {
            throw new NotFoundCException_1.NotFoundCException(OwnerConstant_1.OwnerConstant.STUDENT_NOT_FOUND);
        }
        student.Status = StudentModel_1.StudentRequestStatusEnum.Rejected;
        student.RejectionReason = request?.RejectionReason?.trim() || "Registration request declined by academy owner.";
        await student.save();
        return this.MapToDTO(student);
    }
    async GetAllStudentsAsync() {
        const students = await StudentModel_1.StudentModel.find({
            Status: StudentModel_1.StudentRequestStatusEnum.Approved,
            IsDeleted: { $ne: true }
        })
            .sort({ CreatedAt: -1 })
            .exec();
        return students.map((s) => this.MapToDTO(s));
    }
    async UpdateStudentTargetAsync(idOrPhone, updates) {
        const student = await StudentModel_1.StudentModel.findOne({
            ...this.GetQuery(idOrPhone),
            IsDeleted: { $ne: true }
        }).exec();
        if (!student) {
            throw new NotFoundCException_1.NotFoundCException(OwnerConstant_1.OwnerConstant.STUDENT_NOT_FOUND);
        }
        if (updates.TargetKm !== undefined)
            student.TargetKm = updates.TargetKm;
        if (updates.TotalDays !== undefined)
            student.TotalDays = updates.TotalDays;
        if (updates.TotalCourseFee !== undefined)
            student.TotalCourseFee = updates.TotalCourseFee;
        if (updates.RemainingDue !== undefined)
            student.RemainingDue = updates.RemainingDue;
        await student.save();
        return this.MapToDTO(student);
    }
    async DeleteStudentAsync(idOrPhone) {
        const query = this.GetQuery(idOrPhone);
        const now = new Date();
        const student = await StudentModel_1.StudentModel.findOne(query).exec();
        if (!student) {
            return false;
        }
        // Soft delete all student records and requests associated with this phone
        await StudentModel_1.StudentModel.updateMany({ PhoneNumber: student.PhoneNumber }, { $set: { IsDeleted: true, DeletedAt: now } }).exec();
        // Deactivate user login
        await UserModel_1.UserModel.updateMany({ PhoneNumber: student.PhoneNumber }, { $set: { IsActive: false } }).exec();
        return true;
    }
    async GetArchivedStudentsAsync() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        // Auto purge records older than 30 days
        const expiredStudents = await StudentModel_1.StudentModel.find({
            IsDeleted: true,
            DeletedAt: { $lt: thirtyDaysAgo }
        }).exec();
        if (expiredStudents.length > 0) {
            const expiredPhones = expiredStudents.map((s) => s.PhoneNumber);
            await StudentModel_1.StudentModel.deleteMany({ PhoneNumber: { $in: expiredPhones }, IsDeleted: true }).exec();
            await UserModel_1.UserModel.deleteMany({ PhoneNumber: { $in: expiredPhones } }).exec();
        }
        const archived = await StudentModel_1.StudentModel.find({
            IsDeleted: true
        })
            .sort({ DeletedAt: -1 })
            .exec();
        return archived.map((s) => this.MapToDTO(s));
    }
    async RestoreStudentAsync(idOrPhone) {
        const query = this.GetQuery(idOrPhone);
        const student = await StudentModel_1.StudentModel.findOne(query).exec();
        if (!student) {
            throw new NotFoundCException_1.NotFoundCException(OwnerConstant_1.OwnerConstant.STUDENT_NOT_FOUND);
        }
        // Restore all student records and requests associated with this phone
        await StudentModel_1.StudentModel.updateMany({ PhoneNumber: student.PhoneNumber }, { $set: { IsDeleted: false, DeletedAt: null } }).exec();
        // Reactivate user login
        await UserModel_1.UserModel.updateMany({ PhoneNumber: student.PhoneNumber }, { $set: { IsActive: true } }).exec();
        const updated = await StudentModel_1.StudentModel.findOne(query).exec();
        return this.MapToDTO(updated || student);
    }
    async ReenrollStudentAsync(idOrPhone, payload, ownerName = "Owner Administrator") {
        const query = this.GetQuery(idOrPhone);
        const student = await StudentModel_1.StudentModel.findOne({
            ...query,
            IsDeleted: { $ne: true }
        }).exec();
        if (!student) {
            throw new NotFoundCException_1.NotFoundCException(OwnerConstant_1.OwnerConstant.STUDENT_NOT_FOUND);
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
        student.RemainingDue = Math.max(0, (student.RemainingDue || 0) + ((payload.NewCourseFee || 0) - (payload.InitialPayment || 0)));
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
        student.Status = StudentModel_1.StudentRequestStatusEnum.Approved;
        await student.save();
        return this.MapToDTO(student);
    }
    async PermanentlyDeleteStudentAsync(idOrPhone) {
        const query = this.GetQuery(idOrPhone);
        const student = await StudentModel_1.StudentModel.findOne(query).exec();
        if (!student) {
            return false;
        }
        await StudentModel_1.StudentModel.deleteMany({ PhoneNumber: student.PhoneNumber }).exec();
        await UserModel_1.UserModel.deleteMany({ PhoneNumber: student.PhoneNumber }).exec();
        return true;
    }
}
exports.OwnerService = OwnerService;

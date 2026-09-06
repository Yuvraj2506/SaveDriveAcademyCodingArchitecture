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
            Payments: student.Payments || []
        };
    }
    GetQuery(idOrPhone) {
        return idOrPhone.length === 24 && /^[0-9a-fA-F]{24}$/.test(idOrPhone)
            ? { _id: idOrPhone }
            : { PhoneNumber: idOrPhone.trim() };
    }
    async GetAllStudentRequestsAsync() {
        const requests = await StudentModel_1.StudentModel.find().sort({ CreatedAt: -1 }).exec();
        return requests.map((r) => this.MapToDTO(r));
    }
    async ApproveStudentRequestAsync(idOrPhone, ownerName = "Owner Administrator") {
        const student = await StudentModel_1.StudentModel.findOne(this.GetQuery(idOrPhone)).exec();
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
        const student = await StudentModel_1.StudentModel.findOne(this.GetQuery(idOrPhone)).exec();
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
            Status: StudentModel_1.StudentRequestStatusEnum.Approved
        })
            .sort({ CreatedAt: -1 })
            .exec();
        return students.map((s) => this.MapToDTO(s));
    }
    async UpdateStudentTargetAsync(idOrPhone, updates) {
        const student = await StudentModel_1.StudentModel.findOne(this.GetQuery(idOrPhone)).exec();
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
        const student = await StudentModel_1.StudentModel.findOneAndDelete(query).exec();
        if (student) {
            await UserModel_1.UserModel.findOneAndDelete({ PhoneNumber: student.PhoneNumber }).exec();
            return true;
        }
        return false;
    }
}
exports.OwnerService = OwnerService;

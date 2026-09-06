"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentModel = exports.StudentRequestStatusEnum = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var StudentRequestStatusEnum;
(function (StudentRequestStatusEnum) {
    StudentRequestStatusEnum["Pending"] = "Pending";
    StudentRequestStatusEnum["Approved"] = "Approved";
    StudentRequestStatusEnum["Rejected"] = "Rejected";
})(StudentRequestStatusEnum || (exports.StudentRequestStatusEnum = StudentRequestStatusEnum = {}));
const StudentPaymentSchema = new mongoose_1.Schema({
    ReceiptNumber: { type: String, required: true },
    Date: { type: String, required: true },
    Method: { type: String, required: true },
    Amount: { type: Number, required: true },
    RecordedBy: { type: String, required: true }
}, { _id: false });
const StudentSchema = new mongoose_1.Schema({
    Name: {
        type: String,
        required: true,
        trim: true
    },
    PhoneNumber: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    VehicleType: {
        type: String,
        required: true,
        default: "4-Wheeler"
    },
    CoursePackage: {
        type: String,
        required: true
    },
    TrainingType: {
        type: String,
        required: true,
        default: "4w_personal"
    },
    TargetKm: {
        type: Number,
        required: true,
        default: 0
    },
    CompletedKm: {
        type: Number,
        required: true,
        default: 0
    },
    TotalDays: {
        type: Number,
        required: true,
        default: 15
    },
    CompletedDays: {
        type: Number,
        required: true,
        default: 0
    },
    TotalCourseFee: {
        type: Number,
        required: true,
        default: 0
    },
    TotalPaid: {
        type: Number,
        required: true,
        default: 0
    },
    RemainingDue: {
        type: Number,
        required: true,
        default: 0
    },
    AssignedInstructor: {
        type: String,
        required: true,
        default: "Staff Instructor"
    },
    PaymentMethod: {
        type: String,
        required: true,
        default: "UPI"
    },
    RequestedBy: {
        type: String,
        required: true,
        default: "Staff Member"
    },
    RequestedDate: {
        type: String,
        required: true
    },
    ApprovedBy: {
        type: String,
        default: null
    },
    ApprovedDate: {
        type: String,
        default: null
    },
    RejectionReason: {
        type: String,
        default: null
    },
    Status: {
        type: String,
        enum: Object.values(StudentRequestStatusEnum),
        required: true,
        default: StudentRequestStatusEnum.Pending,
        index: true
    },
    Payments: {
        type: [StudentPaymentSchema],
        default: []
    }
}, {
    timestamps: {
        createdAt: "CreatedAt",
        updatedAt: "UpdatedAt"
    }
});
exports.StudentModel = mongoose_1.default.models.Student || mongoose_1.default.model("Student", StudentSchema);

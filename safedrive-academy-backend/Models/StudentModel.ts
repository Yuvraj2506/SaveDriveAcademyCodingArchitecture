import mongoose, { Document, Schema, Model } from "mongoose";

export enum StudentRequestStatusEnum {
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected"
}

export interface IStudentPaymentRecord {
  ReceiptNumber: string;
  Date: string;
  Method: string;
  Amount: number;
  RecordedBy: string;
}

export interface IStudentDocument extends Document {
  Name: string;
  PhoneNumber: string;
  VehicleType: string;
  CoursePackage: string;
  TrainingType: string;
  TargetKm: number;
  CompletedKm: number;
  TotalDays: number;
  CompletedDays: number;
  TotalCourseFee: number;
  TotalPaid: number;
  RemainingDue: number;
  AssignedInstructor: string;
  PaymentMethod: string;
  RequestedBy: string;
  RequestedDate: string;
  ApprovedBy?: string | null;
  ApprovedDate?: string | null;
  RejectionReason?: string | null;
  Status: StudentRequestStatusEnum;
  Payments: IStudentPaymentRecord[];
  IsDeleted?: boolean;
  DeletedAt?: Date | null;
  CreatedAt: Date;
  UpdatedAt: Date;
}

const StudentPaymentSchema: Schema<IStudentPaymentRecord> = new Schema<IStudentPaymentRecord>(
  {
    ReceiptNumber: { type: String, required: true },
    Date: { type: String, required: true },
    Method: { type: String, required: true },
    Amount: { type: Number, required: true },
    RecordedBy: { type: String, required: true }
  },
  { _id: false }
);

const StudentSchema: Schema<IStudentDocument> = new Schema<IStudentDocument>(
  {
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
    },
    IsDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    DeletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: {
      createdAt: "CreatedAt",
      updatedAt: "UpdatedAt"
    }
  }
);

export const StudentModel: Model<IStudentDocument> =
  mongoose.models.Student || mongoose.model<IStudentDocument>("Student", StudentSchema);

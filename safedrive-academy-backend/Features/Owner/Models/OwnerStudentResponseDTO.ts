export interface OwnerStudentResponseDTO {
  Id: string;
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
  Status: string;
  Payments: Array<{
    ReceiptNumber: string;
    Date: string;
    Method: string;
    Amount: number;
    RecordedBy: string;
    ReferenceNote?: string;
  }>;
  CourseHistory?: Array<{
    CoursePackage: string;
    VehicleType: string;
    TrainingType: string;
    TargetKm: number;
    CompletedKm: number;
    TotalDays: number;
    CompletedDays: number;
    Fee: number;
    EnrolledDate: string;
    CompletedDate: string;
    AssignedInstructor?: string;
  }>;
  IsInactive?: boolean;
  IsDeleted?: boolean;
  DeletedAt?: string | Date | null;
}

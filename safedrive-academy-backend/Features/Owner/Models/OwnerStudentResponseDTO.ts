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
  }>;
}

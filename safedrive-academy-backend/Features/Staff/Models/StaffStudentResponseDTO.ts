export interface StaffStudentResponseDTO {
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
  Status: string;
  ApprovedBy?: string | null;
  ApprovedDate?: string | null;
  RejectionReason?: string | null;
}

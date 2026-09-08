export interface CreateStudentRequestDTO {
  Name: string;
  PhoneNumber: string;
  VehicleType: string;
  CoursePackage: string;
  TrainingType: string;
  TargetKm?: number;
  TotalDays?: number;
  TotalCourseFee: number;
  TotalPaid: number;
  RemainingDue: number;
  AssignedInstructor: string;
  PaymentMethod: string;
  RequestedBy?: string;
  ReferenceNote?: string;
}

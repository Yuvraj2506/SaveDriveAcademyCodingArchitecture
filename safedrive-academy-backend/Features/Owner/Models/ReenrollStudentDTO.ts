export interface ReenrollStudentDTO {
  CoursePackage: string;
  VehicleType: string;
  TrainingType: string;
  TargetKm?: number;
  TotalDays?: number;
  NewCourseFee: number;
  InitialPayment: number;
  PaymentMethod: string;
  ReferenceNote?: string;
  AssignedInstructor?: string;
}

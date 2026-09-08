export type PaymentMethod = "UPI" | "CASH" | "CHEQUE" | "Cash" | "Credit Card" | "Debit Card" | "online" | "upi" | "card" | string;

export type TrainingType =
  | "4-Wheeler"
  | "2-Wheeler"
  | "License-Only"
  | "4w_group"
  | "4w_personal"
  | "2w_bike"
  | "2w_scooty"
  | "license_only"
  | string;

export interface CleanPaymentRecord {
  id?: string;
  receiptNumber: string;
  date: string;
  method: PaymentMethod;
  amount: number;
  note?: string;
  referenceNote?: string;
  recordedBy?: string;
  receivedBy?: string;
}

export interface CleanCourseHistory {
  coursePackage: string;
  vehicleType: string;
  trainingType: string;
  targetKm: number;
  completedKm: number;
  totalDays: number;
  completedDays: number;
  fee: number;
  enrolledDate: string;
  completedDate: string;
  assignedInstructor?: string;
}

export interface CleanStudentData {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  vehicleType: "4-Wheeler" | "2-Wheeler" | "License-Only" | "4w" | "2w" | "license_only" | string;
  coursePackage: string;
  trainingType?: TrainingType;
  targetKm: number;
  completedKm: number;
  totalDays?: number;
  completedDays?: number;
  totalCourseFee: number;
  totalFee?: number;
  totalPaid: number;
  remainingDue: number;
  assignedInstructor: string;
  status: "active" | "completed" | "paused" | string;
  registrationDate?: string;
  approvedDate?: string;
  dueDateNote?: string;
  payments: CleanPaymentRecord[];
  courseHistory?: CleanCourseHistory[];
  isInactive?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface CleanPendingRequest {
  id?: string;
  requestId: string;
  name: string;
  studentName?: string;
  phone: string;
  type?: string;
  vehicleType?: "4-Wheeler" | "2-Wheeler" | "License-Only" | "4w" | "2w" | "license_only" | string;
  course?: string;
  coursePackage?: string;
  trainingType?: TrainingType;
  targetKm?: number;
  instructor?: string;
  assignedInstructor?: string;
  requestedBy?: string;
  requestedByStaff?: string;
  requestedDate?: string;
  date?: string;
  amountPaid: number;
  initialPayment?: number;
  amountDue: number;
  totalFee?: number;
  paymentMethod?: PaymentMethod;
  requestType?: "new_student" | "payment_entry" | string;
  referenceNote?: string;
  notes?: string;
  status: "pending" | "approved" | "rejected" | "Pending Owner Approval" | string;
  categoryOption?: string;
  serviceCategory?: string;
  subOption?: string;
}

export type PendingStudentRequest = CleanPendingRequest;
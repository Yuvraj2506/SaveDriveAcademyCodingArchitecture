"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffConstant = void 0;
class StaffConstant {
    static STUDENT_REQUEST_CREATED = "Student registration request submitted successfully and is awaiting Owner approval.";
    static STUDENT_REQUESTS_FETCHED = "Student registration requests fetched successfully.";
    static APPROVED_STUDENTS_FETCHED = "Approved student records fetched successfully.";
    static PROGRESS_UPDATED = "Student training progress updated successfully.";
    static STUDENT_NOT_FOUND = "Student record not found.";
    static NAME_REQUIRED = "Student full name is required.";
    static PHONE_REQUIRED = "Valid 10-digit Indian mobile number is required.";
    static COURSE_REQUIRED = "Course package is required.";
    static REQUEST_BODY_EMPTY = "Request body cannot be empty.";
}
exports.StaffConstant = StaffConstant;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffAssertion = void 0;
const ValidationCException_1 = require("../../../Exceptions/ValidationCException");
const IndianPhoneCValidator_1 = require("../../../Validators/IndianPhoneCValidator");
const StaffConstant_1 = require("../Constants/StaffConstant");
class StaffAssertion {
    static _current = new StaffAssertion();
    static get Current() {
        return StaffAssertion._current;
    }
    constructor() { }
    CheckForNullRequest(request, errorMessage = StaffConstant_1.StaffConstant.REQUEST_BODY_EMPTY) {
        if (request === null || request === undefined || typeof request !== "object" || Object.keys(request).length === 0) {
            throw new ValidationCException_1.ValidationCException(errorMessage);
        }
    }
    AssertCreateStudentRequest(request) {
        this.CheckForNullRequest(request, StaffConstant_1.StaffConstant.REQUEST_BODY_EMPTY);
        const validationErrors = [];
        if (!request.Name || typeof request.Name !== "string" || request.Name.trim() === "") {
            validationErrors.push(StaffConstant_1.StaffConstant.NAME_REQUIRED);
        }
        if (!IndianPhoneCValidator_1.IndianPhoneCValidator.Current.Validate(request.PhoneNumber)) {
            validationErrors.push(StaffConstant_1.StaffConstant.PHONE_REQUIRED);
        }
        if (!request.CoursePackage || typeof request.CoursePackage !== "string" || request.CoursePackage.trim() === "") {
            validationErrors.push(StaffConstant_1.StaffConstant.COURSE_REQUIRED);
        }
        if (validationErrors.length > 0) {
            throw new ValidationCException_1.ValidationCException(validationErrors);
        }
    }
    AssertUpdateProgressRequest(request) {
        this.CheckForNullRequest(request, StaffConstant_1.StaffConstant.REQUEST_BODY_EMPTY);
        const validationErrors = [];
        if (request.CompletedKm !== undefined && (typeof request.CompletedKm !== "number" || request.CompletedKm < 0)) {
            validationErrors.push("Completed kilometers must be a non-negative number.");
        }
        if (request.CompletedDays !== undefined && (typeof request.CompletedDays !== "number" || request.CompletedDays < 0)) {
            validationErrors.push("Completed days must be a non-negative number.");
        }
        if (validationErrors.length > 0) {
            throw new ValidationCException_1.ValidationCException(validationErrors);
        }
    }
}
exports.StaffAssertion = StaffAssertion;

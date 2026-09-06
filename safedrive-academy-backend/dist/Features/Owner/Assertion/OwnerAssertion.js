"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnerAssertion = void 0;
const ValidationCException_1 = require("../../../Exceptions/ValidationCException");
const OwnerConstant_1 = require("../Constants/OwnerConstant");
class OwnerAssertion {
    static _current = new OwnerAssertion();
    static get Current() {
        return OwnerAssertion._current;
    }
    constructor() { }
    CheckForNullRequest(request, errorMessage = OwnerConstant_1.OwnerConstant.REQUEST_BODY_EMPTY) {
        if (request === null || request === undefined || typeof request !== "object" || Object.keys(request).length === 0) {
            throw new ValidationCException_1.ValidationCException(errorMessage);
        }
    }
    AssertRejectStudentRequest(request) {
        // Rejection reason is optional
    }
    AssertUpdateStudentTargetRequest(request) {
        this.CheckForNullRequest(request, OwnerConstant_1.OwnerConstant.REQUEST_BODY_EMPTY);
        const validationErrors = [];
        if (request.TargetKm !== undefined && (typeof request.TargetKm !== "number" || request.TargetKm < 0)) {
            validationErrors.push("Target kilometers must be a non-negative number.");
        }
        if (request.TotalDays !== undefined && (typeof request.TotalDays !== "number" || request.TotalDays < 0)) {
            validationErrors.push("Total days must be a non-negative number.");
        }
        if (validationErrors.length > 0) {
            throw new ValidationCException_1.ValidationCException(validationErrors);
        }
    }
}
exports.OwnerAssertion = OwnerAssertion;

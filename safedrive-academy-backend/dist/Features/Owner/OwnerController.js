"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnerController = void 0;
const express_1 = require("express");
const ApiResponseClass_1 = require("../../Models/Classes/ApiResponseClass");
const BaseCException_1 = require("../../Exceptions/BaseCException");
const ValidationCException_1 = require("../../Exceptions/ValidationCException");
const UnauthorizedCException_1 = require("../../Exceptions/UnauthorizedCException");
const NotFoundCException_1 = require("../../Exceptions/NotFoundCException");
const OwnerAssertion_1 = require("./Assertion/OwnerAssertion");
const OwnerService_1 = require("./Services/OwnerService");
const OwnerConstant_1 = require("./Constants/OwnerConstant");
class OwnerController {
    static _current = new OwnerController();
    _router;
    static get Current() {
        return OwnerController._current;
    }
    constructor() {
        this._router = (0, express_1.Router)();
        this.RegisterRoutes();
    }
    get Router() {
        return this._router;
    }
    RegisterRoutes() {
        this._router.get("/student-requests", this.GetAllStudentRequests.bind(this));
        this._router.post("/student-requests/:id/approve", this.ApproveStudentRequest.bind(this));
        this._router.post("/student-requests/:id/reject", this.RejectStudentRequest.bind(this));
        this._router.get("/students", this.GetAllStudents.bind(this));
        this._router.patch("/students/:id", this.UpdateStudentTarget.bind(this));
        this._router.delete("/students/:id", this.DeleteStudent.bind(this));
    }
    async GetAllStudentRequests(req, res) {
        try {
            const response = await OwnerService_1.OwnerService.Current.GetAllStudentRequestsAsync();
            res
                .status(200)
                .json(ApiResponseClass_1.ApiResponseClass.Succeeded(response, OwnerConstant_1.OwnerConstant.ALL_REQUESTS_FETCHED, 200));
        }
        catch (error) {
            this.HandleError(res, error, "GetAllStudentRequests");
        }
    }
    async ApproveStudentRequest(req, res) {
        try {
            const id = String(req.params.id);
            const ownerName = req.body?.ApprovedBy || "Yuvraj Gupta (Owner)";
            const response = await OwnerService_1.OwnerService.Current.ApproveStudentRequestAsync(id, ownerName);
            res
                .status(200)
                .json(ApiResponseClass_1.ApiResponseClass.Succeeded(response, OwnerConstant_1.OwnerConstant.REQUEST_APPROVED, 200));
        }
        catch (error) {
            this.HandleError(res, error, "ApproveStudentRequest");
        }
    }
    async RejectStudentRequest(req, res) {
        try {
            const id = String(req.params.id);
            const request = req.body || {};
            OwnerAssertion_1.OwnerAssertion.Current.AssertRejectStudentRequest(request);
            const response = await OwnerService_1.OwnerService.Current.RejectStudentRequestAsync(id, request);
            res
                .status(200)
                .json(ApiResponseClass_1.ApiResponseClass.Succeeded(response, OwnerConstant_1.OwnerConstant.REQUEST_REJECTED, 200));
        }
        catch (error) {
            this.HandleError(res, error, "RejectStudentRequest");
        }
    }
    async GetAllStudents(req, res) {
        try {
            const response = await OwnerService_1.OwnerService.Current.GetAllStudentsAsync();
            res
                .status(200)
                .json(ApiResponseClass_1.ApiResponseClass.Succeeded(response, OwnerConstant_1.OwnerConstant.ALL_STUDENTS_FETCHED, 200));
        }
        catch (error) {
            this.HandleError(res, error, "GetAllStudents");
        }
    }
    async UpdateStudentTarget(req, res) {
        try {
            const id = String(req.params.id);
            const request = req.body;
            OwnerAssertion_1.OwnerAssertion.Current.AssertUpdateStudentTargetRequest(request);
            const response = await OwnerService_1.OwnerService.Current.UpdateStudentTargetAsync(id, request);
            res
                .status(200)
                .json(ApiResponseClass_1.ApiResponseClass.Succeeded(response, OwnerConstant_1.OwnerConstant.STUDENT_UPDATED, 200));
        }
        catch (error) {
            this.HandleError(res, error, "UpdateStudentTarget");
        }
    }
    async DeleteStudent(req, res) {
        try {
            const id = String(req.params.id);
            const success = await OwnerService_1.OwnerService.Current.DeleteStudentAsync(id);
            if (!success) {
                throw new NotFoundCException_1.NotFoundCException(OwnerConstant_1.OwnerConstant.STUDENT_NOT_FOUND);
            }
            res
                .status(200)
                .json(ApiResponseClass_1.ApiResponseClass.Succeeded(true, OwnerConstant_1.OwnerConstant.STUDENT_DELETED, 200));
        }
        catch (error) {
            this.HandleError(res, error, "DeleteStudent");
        }
    }
    HandleError(res, error, contextName) {
        if (error instanceof ValidationCException_1.ValidationCException) {
            res
                .status(error.StatusCode)
                .json(ApiResponseClass_1.ApiResponseClass.Failed(error.message, error.ValidationErrors, error.StatusCode));
            return;
        }
        if (error instanceof UnauthorizedCException_1.UnauthorizedCException) {
            res
                .status(error.StatusCode)
                .json(ApiResponseClass_1.ApiResponseClass.Failed(error.message, error.ValidationErrors, error.StatusCode));
            return;
        }
        if (error instanceof NotFoundCException_1.NotFoundCException) {
            res
                .status(error.StatusCode)
                .json(ApiResponseClass_1.ApiResponseClass.Failed(error.message, error.ValidationErrors, error.StatusCode));
            return;
        }
        if (error instanceof BaseCException_1.BaseCException) {
            res
                .status(error.StatusCode)
                .json(ApiResponseClass_1.ApiResponseClass.Failed(error.message, error.ValidationErrors, error.StatusCode));
            return;
        }
        console.error(`[OwnerController] Unexpected error in ${contextName}:`, error);
        res
            .status(500)
            .json(ApiResponseClass_1.ApiResponseClass.Failed(`An unexpected error occurred while processing the ${contextName} request.`, [error?.message || "Internal server error."], 500));
    }
}
exports.OwnerController = OwnerController;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffController = void 0;
const express_1 = require("express");
const ApiResponseClass_1 = require("../../Models/Classes/ApiResponseClass");
const BaseCException_1 = require("../../Exceptions/BaseCException");
const ValidationCException_1 = require("../../Exceptions/ValidationCException");
const UnauthorizedCException_1 = require("../../Exceptions/UnauthorizedCException");
const NotFoundCException_1 = require("../../Exceptions/NotFoundCException");
const StaffAssertion_1 = require("./Assertion/StaffAssertion");
const StaffService_1 = require("./Services/StaffService");
const StaffConstant_1 = require("./Constants/StaffConstant");
class StaffController {
    static _current = new StaffController();
    _router;
    static get Current() {
        return StaffController._current;
    }
    constructor() {
        this._router = (0, express_1.Router)();
        this.RegisterRoutes();
    }
    get Router() {
        return this._router;
    }
    RegisterRoutes() {
        this._router.post("/student-requests", this.CreateStudentRequest.bind(this));
        this._router.get("/student-requests", this.GetStudentRequests.bind(this));
        this._router.get("/students", this.GetApprovedStudents.bind(this));
        this._router.patch("/students/:id/km", this.UpdateStudentKm.bind(this));
        this._router.patch("/students/:id/days", this.UpdateStudentDays.bind(this));
    }
    async CreateStudentRequest(req, res) {
        try {
            const request = req.body;
            StaffAssertion_1.StaffAssertion.Current.CheckForNullRequest(request);
            StaffAssertion_1.StaffAssertion.Current.AssertCreateStudentRequest(request);
            const staffName = req.body.RequestedBy || "Ramesh Kumar (Staff)";
            const response = await StaffService_1.StaffService.Current.CreateStudentRequestAsync(request, staffName);
            res
                .status(201)
                .json(ApiResponseClass_1.ApiResponseClass.Succeeded(response, StaffConstant_1.StaffConstant.STUDENT_REQUEST_CREATED, 201));
        }
        catch (error) {
            this.HandleError(res, error, "CreateStudentRequest");
        }
    }
    async GetStudentRequests(req, res) {
        try {
            const response = await StaffService_1.StaffService.Current.GetStudentRequestsAsync();
            res
                .status(200)
                .json(ApiResponseClass_1.ApiResponseClass.Succeeded(response, StaffConstant_1.StaffConstant.STUDENT_REQUESTS_FETCHED, 200));
        }
        catch (error) {
            this.HandleError(res, error, "GetStudentRequests");
        }
    }
    async GetApprovedStudents(req, res) {
        try {
            const response = await StaffService_1.StaffService.Current.GetApprovedStudentsAsync();
            res
                .status(200)
                .json(ApiResponseClass_1.ApiResponseClass.Succeeded(response, StaffConstant_1.StaffConstant.APPROVED_STUDENTS_FETCHED, 200));
        }
        catch (error) {
            this.HandleError(res, error, "GetApprovedStudents");
        }
    }
    async UpdateStudentKm(req, res) {
        try {
            const id = String(req.params.id);
            const { CompletedKm } = req.body;
            if (CompletedKm === undefined || typeof CompletedKm !== "number") {
                throw new ValidationCException_1.ValidationCException("CompletedKm is required and must be a number.");
            }
            const response = await StaffService_1.StaffService.Current.UpdateStudentKmAsync(id, CompletedKm);
            res
                .status(200)
                .json(ApiResponseClass_1.ApiResponseClass.Succeeded(response, StaffConstant_1.StaffConstant.PROGRESS_UPDATED, 200));
        }
        catch (error) {
            this.HandleError(res, error, "UpdateStudentKm");
        }
    }
    async UpdateStudentDays(req, res) {
        try {
            const id = String(req.params.id);
            const { CompletedDays } = req.body;
            if (CompletedDays === undefined || typeof CompletedDays !== "number") {
                throw new ValidationCException_1.ValidationCException("CompletedDays is required and must be a number.");
            }
            const response = await StaffService_1.StaffService.Current.UpdateStudentDaysAsync(id, CompletedDays);
            res
                .status(200)
                .json(ApiResponseClass_1.ApiResponseClass.Succeeded(response, StaffConstant_1.StaffConstant.PROGRESS_UPDATED, 200));
        }
        catch (error) {
            this.HandleError(res, error, "UpdateStudentDays");
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
        console.error(`[StaffController] Unexpected error in ${contextName}:`, error);
        res
            .status(500)
            .json(ApiResponseClass_1.ApiResponseClass.Failed(`An unexpected error occurred while processing the ${contextName} request.`, [error?.message || "Internal server error."], 500));
    }
}
exports.StaffController = StaffController;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalErrorMiddleware = void 0;
const BaseCException_1 = require("../Exceptions/BaseCException");
const ApiResponseClass_1 = require("../Models/Classes/ApiResponseClass");
class GlobalErrorMiddleware {
    static _current = new GlobalErrorMiddleware();
    static get Current() {
        return GlobalErrorMiddleware._current;
    }
    constructor() { }
    Handle(error, req, res, next) {
        if (error instanceof BaseCException_1.BaseCException) {
            console.warn(`[BaseCException] ${error.name}: ${error.message} (Status: ${error.StatusCode})`);
            res.status(error.StatusCode).json(ApiResponseClass_1.ApiResponseClass.Failed(error.message, error.ValidationErrors, error.StatusCode));
            return;
        }
        console.error("[UnhandledError]", error);
        res.status(500).json(ApiResponseClass_1.ApiResponseClass.Failed("An unexpected internal server error occurred.", [error.message || "Internal server error."], 500));
    }
}
exports.GlobalErrorMiddleware = GlobalErrorMiddleware;

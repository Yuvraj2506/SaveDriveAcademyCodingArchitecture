"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponseClass = void 0;
class ApiResponseClass {
    StatusCode;
    Success;
    Message;
    Data;
    Errors;
    Timestamp;
    constructor(statusCode, success, message, data = null, errors = null) {
        this.StatusCode = statusCode;
        this.Success = success;
        this.Message = message;
        this.Data = data;
        this.Errors = errors;
        this.Timestamp = new Date().toISOString();
    }
    static Succeeded(data, message = "Operation succeeded.", statusCode = 200) {
        return new ApiResponseClass(statusCode, true, message, data, null);
    }
    static Failed(message, errors = [], statusCode = 400) {
        const errorList = errors.length > 0 ? errors : [message];
        return new ApiResponseClass(statusCode, false, message, null, errorList);
    }
}
exports.ApiResponseClass = ApiResponseClass;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationRouteFactory = void 0;
class ApplicationRouteFactory {
    static _current = new ApplicationRouteFactory();
    static get Current() {
        return ApplicationRouteFactory._current;
    }
    constructor() { }
    static AuthenticationRoutes = {
        ControllerURL: "/api/authentication",
        Login: "/login",
        RefreshToken: "/refresh",
        Logout: "/logout",
        VerifyPhone: "/verify-phone",
        SetPassword: "/set-password"
    };
    static StudentRoutes = {
        ControllerURL: "/api/students",
        GetAll: "/",
        GetById: "/:id",
        UpdateKm: "/:id/km",
        UpdateDays: "/:id/days",
        Delete: "/:id"
    };
    static PendingRequestRoutes = {
        ControllerURL: "/api/requests",
        GetAll: "/",
        Create: "/",
        Approve: "/:id/approve",
        Reject: "/:id/reject"
    };
    static StaffRoutes = {
        ControllerURL: "/api/staff",
        StudentRequests: "/student-requests",
        Students: "/students",
        UpdateKm: "/students/:id/km",
        UpdateDays: "/students/:id/days"
    };
    static OwnerRoutes = {
        ControllerURL: "/api/owner",
        StudentRequests: "/student-requests",
        ApproveRequest: "/student-requests/:id/approve",
        RejectRequest: "/student-requests/:id/reject",
        Students: "/students",
        UpdateStudent: "/students/:id",
        DeleteStudent: "/students/:id"
    };
}
exports.ApplicationRouteFactory = ApplicationRouteFactory;

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
}
exports.ApplicationRouteFactory = ApplicationRouteFactory;

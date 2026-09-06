export class ApplicationRouteFactory {
  private static readonly _current: ApplicationRouteFactory = new ApplicationRouteFactory();

  public static get Current(): ApplicationRouteFactory {
    return ApplicationRouteFactory._current;
  }

  private constructor() {}

  public static readonly AuthenticationRoutes = {
    ControllerURL: "/api/authentication",
    Login: "/login",
    RefreshToken: "/refresh",
    Logout: "/logout",
    VerifyPhone: "/verify-phone",
    SetPassword: "/set-password"
  } as const;

  public static readonly StudentRoutes = {
    ControllerURL: "/api/students",
    GetAll: "/",
    GetById: "/:id",
    UpdateKm: "/:id/km",
    UpdateDays: "/:id/days",
    Delete: "/:id"
  } as const;

  public static readonly PendingRequestRoutes = {
    ControllerURL: "/api/requests",
    GetAll: "/",
    Create: "/",
    Approve: "/:id/approve",
    Reject: "/:id/reject"
  } as const;

  public static readonly StaffRoutes = {
    ControllerURL: "/api/staff",
    StudentRequests: "/student-requests",
    Students: "/students",
    UpdateKm: "/students/:id/km",
    UpdateDays: "/students/:id/days"
  } as const;

  public static readonly OwnerRoutes = {
    ControllerURL: "/api/owner",
    StudentRequests: "/student-requests",
    ApproveRequest: "/student-requests/:id/approve",
    RejectRequest: "/student-requests/:id/reject",
    Students: "/students",
    UpdateStudent: "/students/:id",
    DeleteStudent: "/students/:id"
  } as const;
}


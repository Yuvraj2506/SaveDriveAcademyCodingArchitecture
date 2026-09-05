export class ApplicationRouteFactory {
  private static readonly _current: ApplicationRouteFactory = new ApplicationRouteFactory();

  public static get Current(): ApplicationRouteFactory {
    return ApplicationRouteFactory._current;
  }

  private constructor() {}

  public static readonly AuthenticationRoutes = {
    ControllerURL: "/api/authentication",
    Login: "/login",
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
}


import express, { Application, Request, Response } from "express";
import cors from "cors";
import { ENValidatorUtility } from "./Utilities/ENValidatorUtility";
import { MongoDbConnectionUtility } from "./Utilities/MongoDbConnectionUtility";
import { ApplicationRouteFactory } from "./Factories/ApplicationRouteFactory";
import { AuthenticationController } from "./Features/Authentication/AuthenticationController";
import { StaffController } from "./Features/Staff/StaffController";
import { OwnerController } from "./Features/Owner/OwnerController";
import { AuthRoleMiddleware } from "./Middlewares/AuthRoleMiddleware";
import { UserRoleEnum } from "./Features/Authentication/Models/UserRoleEnum";
import { GlobalErrorMiddleware } from "./Middlewares/GlobalErrorMiddleware";
import { ApiResponseClass } from "./Models/Classes/ApiResponseClass";

class Server {
  private readonly _app: Application;
  private readonly _port: number;

  constructor() {
    this._app = express();
    ENValidatorUtility.Current.ValidateAll();
    this._port = ENValidatorUtility.Current.Port;
    this.ConfigureMiddleware();
    this.ConfigureRoutes();
    this.ConfigureErrorHandling();
  }

  private ConfigureMiddleware(): void {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001"
    ];

    this._app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(null, true); // Permissive in dev, logs allowed origins
          }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
      })
    );
    this._app.use(express.json());
    this._app.use(express.urlencoded({ extended: true }));
  }

  private ConfigureRoutes(): void {
    this._app.get("/health", (req: Request, res: Response) => {
      res.status(200).json(
        ApiResponseClass.Succeeded(
          {
            Status: "Healthy",
            Database: MongoDbConnectionUtility.Current.IsConnected ? "Connected" : "Disconnected"
          },
          "SafeDrive Academy backend is running.",
          200
        )
      );
    });

    this._app.use(
      ApplicationRouteFactory.AuthenticationRoutes.ControllerURL,
      AuthenticationController.Current.Router
    );

    this._app.use(
      ApplicationRouteFactory.StaffRoutes.ControllerURL,
      AuthRoleMiddleware.Current.AuthorizeRoles(UserRoleEnum.Staff, UserRoleEnum.Owner),
      StaffController.Current.Router
    );

    this._app.use(
      ApplicationRouteFactory.OwnerRoutes.ControllerURL,
      AuthRoleMiddleware.Current.AuthorizeRoles(UserRoleEnum.Owner),
      OwnerController.Current.Router
    );

    this._app.use((req: Request, res: Response) => {
      res.status(404).json(
        ApiResponseClass.Failed<null>(
          `Endpoint ${req.method} ${req.originalUrl} not found.`,
          ["Route not found."],
          404
        )
      );
    });
  }

  private ConfigureErrorHandling(): void {
    this._app.use(GlobalErrorMiddleware.Current.Handle.bind(GlobalErrorMiddleware.Current));
  }

  public async StartAsync(): Promise<void> {
    try {
      await MongoDbConnectionUtility.Current.ConnectAsync();
      this._app.listen(this._port, () => {
        console.log(`[SafeDrive Academy Server] Server listening on port ${this._port}`);
        console.log(`[SafeDrive Academy Server] Authentication API: ${ApplicationRouteFactory.AuthenticationRoutes.ControllerURL}`);
      });
    } catch (error) {
      console.error("[SafeDrive Academy Server] Failed to start server:", error);
      process.exit(1);
    }
  }
}

const server: Server = new Server();
server.StartAsync();


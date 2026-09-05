"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const ENValidatorUtility_1 = require("./Utilities/ENValidatorUtility");
const MongoDbConnectionUtility_1 = require("./Utilities/MongoDbConnectionUtility");
const ApplicationRouteFactory_1 = require("./Factories/ApplicationRouteFactory");
const AuthenticationController_1 = require("./Features/Authentication/AuthenticationController");
const GlobalErrorMiddleware_1 = require("./Middlewares/GlobalErrorMiddleware");
const ApiResponseClass_1 = require("./Models/Classes/ApiResponseClass");
class Server {
    _app;
    _port;
    constructor() {
        this._app = (0, express_1.default)();
        ENValidatorUtility_1.ENValidatorUtility.Current.ValidateAll();
        this._port = ENValidatorUtility_1.ENValidatorUtility.Current.Port;
        this.ConfigureMiddleware();
        this.ConfigureRoutes();
        this.ConfigureErrorHandling();
    }
    ConfigureMiddleware() {
        this._app.use((0, cors_1.default)());
        this._app.use(express_1.default.json());
        this._app.use(express_1.default.urlencoded({ extended: true }));
    }
    ConfigureRoutes() {
        this._app.get("/health", (req, res) => {
            res.status(200).json(ApiResponseClass_1.ApiResponseClass.Succeeded({
                Status: "Healthy",
                Database: MongoDbConnectionUtility_1.MongoDbConnectionUtility.Current.IsConnected ? "Connected" : "Disconnected"
            }, "SafeDrive Academy backend is running.", 200));
        });
        this._app.use(ApplicationRouteFactory_1.ApplicationRouteFactory.AuthenticationRoutes.ControllerURL, AuthenticationController_1.AuthenticationController.Current.Router);
        this._app.use((req, res) => {
            res.status(404).json(ApiResponseClass_1.ApiResponseClass.Failed(`Endpoint ${req.method} ${req.originalUrl} not found.`, ["Route not found."], 404));
        });
    }
    ConfigureErrorHandling() {
        this._app.use(GlobalErrorMiddleware_1.GlobalErrorMiddleware.Current.Handle.bind(GlobalErrorMiddleware_1.GlobalErrorMiddleware.Current));
    }
    async StartAsync() {
        try {
            await MongoDbConnectionUtility_1.MongoDbConnectionUtility.Current.ConnectAsync();
            this._app.listen(this._port, () => {
                console.log(`[SafeDrive Academy Server] Server listening on port ${this._port}`);
                console.log(`[SafeDrive Academy Server] Authentication API: ${ApplicationRouteFactory_1.ApplicationRouteFactory.AuthenticationRoutes.ControllerURL}`);
            });
        }
        catch (error) {
            console.error("[SafeDrive Academy Server] Failed to start server:", error);
            process.exit(1);
        }
    }
}
const server = new Server();
server.StartAsync();

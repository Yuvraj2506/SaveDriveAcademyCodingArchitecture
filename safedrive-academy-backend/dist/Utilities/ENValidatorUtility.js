"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENValidatorUtility = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const ConfigurationCException_1 = require("../Exceptions/ConfigurationCException");
class ENValidatorUtility {
    static _current = new ENValidatorUtility();
    _isInitialized = false;
    static get Current() {
        return ENValidatorUtility._current;
    }
    constructor() {
        this.Initialize();
    }
    Initialize() {
        if (!this._isInitialized) {
            dotenv_1.default.config();
            this._isInitialized = true;
        }
    }
    ValidateAll() {
        this.Initialize();
        const requiredVariables = ["PORT", "MONGODB_URI", "JWT_SECRET", "JWT_EXPIRES_IN"];
        const missingVariables = [];
        for (const key of requiredVariables) {
            const value = process.env[key];
            if (!value || value.trim() === "") {
                missingVariables.push(key);
            }
        }
        if (missingVariables.length > 0) {
            throw new ConfigurationCException_1.ConfigurationCException(`Missing mandatory environment variables: ${missingVariables.join(", ")}`);
        }
    }
    GetString(key, isRequired = true, defaultValue = "") {
        this.Initialize();
        const value = process.env[key];
        if (!value || value.trim() === "") {
            if (isRequired) {
                throw new ConfigurationCException_1.ConfigurationCException(`Environment variable "${key}" is required but not set.`);
            }
            return defaultValue;
        }
        return value.trim();
    }
    GetNumber(key, isRequired = true, defaultValue = 0) {
        const rawValue = this.GetString(key, isRequired, defaultValue.toString());
        const parsedNumber = Number(rawValue);
        if (isNaN(parsedNumber)) {
            throw new ConfigurationCException_1.ConfigurationCException(`Environment variable "${key}" must be a valid number.`);
        }
        return parsedNumber;
    }
    get Port() {
        return this.GetNumber("PORT", true, 5000);
    }
    get MongoDbUri() {
        return this.GetString("MONGODB_URI", true);
    }
    get JwtSecret() {
        return this.GetString("JWT_SECRET", true);
    }
    get JwtExpiresIn() {
        return this.GetString("JWT_EXPIRES_IN", false, "7d");
    }
}
exports.ENValidatorUtility = ENValidatorUtility;

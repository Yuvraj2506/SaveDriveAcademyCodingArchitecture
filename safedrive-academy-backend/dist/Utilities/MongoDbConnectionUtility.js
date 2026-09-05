"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDbConnectionUtility = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dns_1 = __importDefault(require("dns"));
const ENValidatorUtility_1 = require("./ENValidatorUtility");
class MongoDbConnectionUtility {
    static _current = new MongoDbConnectionUtility();
    _isConnected = false;
    static get Current() {
        return MongoDbConnectionUtility._current;
    }
    constructor() {
        try {
            dns_1.default.setServers(["8.8.8.8", "1.1.1.1"]);
        }
        catch {
            // Ignore if cannot override dns
        }
    }
    async ConnectAsync() {
        if (this._isConnected || mongoose_1.default.connection.readyState === 1) {
            console.log("[MongoDB] Already connected to database.");
            return;
        }
        const mongoUri = ENValidatorUtility_1.ENValidatorUtility.Current.MongoDbUri;
        try {
            await mongoose_1.default.connect(mongoUri);
            this._isConnected = true;
            console.log("[MongoDB] Successfully connected to MongoDB Atlas.");
        }
        catch (error) {
            console.error("[MongoDB] Connection error:", error);
            throw error;
        }
    }
    async DisconnectAsync() {
        if (this._isConnected || mongoose_1.default.connection.readyState !== 0) {
            await mongoose_1.default.disconnect();
            this._isConnected = false;
            console.log("[MongoDB] Disconnected from database.");
        }
    }
    get IsConnected() {
        return this._isConnected || mongoose_1.default.connection.readyState === 1;
    }
}
exports.MongoDbConnectionUtility = MongoDbConnectionUtility;

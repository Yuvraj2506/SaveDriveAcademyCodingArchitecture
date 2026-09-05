import mongoose from "mongoose";
import dns from "dns";
import { ENValidatorUtility } from "./ENValidatorUtility";

export class MongoDbConnectionUtility {
  private static readonly _current: MongoDbConnectionUtility = new MongoDbConnectionUtility();
  private _isConnected: boolean = false;

  public static get Current(): MongoDbConnectionUtility {
    return MongoDbConnectionUtility._current;
  }

  private constructor() {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch {
      // Ignore if cannot override dns
    }
  }

  public async ConnectAsync(): Promise<void> {
    if (this._isConnected || mongoose.connection.readyState === 1) {
      console.log("[MongoDB] Already connected to database.");
      return;
    }

    const mongoUri: string = ENValidatorUtility.Current.MongoDbUri;
    try {
      await mongoose.connect(mongoUri);
      this._isConnected = true;
      console.log("[MongoDB] Successfully connected to MongoDB Atlas.");
    } catch (error) {
      console.error("[MongoDB] Connection error:", error);
      throw error;
    }
  }

  public async DisconnectAsync(): Promise<void> {
    if (this._isConnected || mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      this._isConnected = false;
      console.log("[MongoDB] Disconnected from database.");
    }
  }

  public get IsConnected(): boolean {
    return this._isConnected || mongoose.connection.readyState === 1;
  }
}


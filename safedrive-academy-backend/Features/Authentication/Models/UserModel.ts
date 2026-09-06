import mongoose, { Document, Schema, Model } from "mongoose";
import { UserRoleEnum } from "./UserRoleEnum";

export interface IUserDocument extends Document {
  PhoneNumber: string;
  Password: string;
  FullName: string;
  Role: UserRoleEnum;
  IsActive: boolean;
  RefreshTokens: string[];
  CreatedAt: Date;
  UpdatedAt: Date;
}

const UserSchema: Schema<IUserDocument> = new Schema<IUserDocument>(
  {
    PhoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    Password: {
      type: String,
      required: true
    },
    FullName: {
      type: String,
      required: true,
      trim: true,
      default: "User"
    },
    Role: {
      type: String,
      enum: Object.values(UserRoleEnum),
      required: true,
      default: UserRoleEnum.Student
    },
    IsActive: {
      type: Boolean,
      default: true
    },
    RefreshTokens: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: {
      createdAt: "CreatedAt",
      updatedAt: "UpdatedAt"
    }
  }
);

export const UserModel: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);


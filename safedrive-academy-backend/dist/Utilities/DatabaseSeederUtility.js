"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseSeederUtility = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const MongoDbConnectionUtility_1 = require("./MongoDbConnectionUtility");
const UserModel_1 = require("../Features/Authentication/Models/UserModel");
const UserRoleEnum_1 = require("../Features/Authentication/Models/UserRoleEnum");
class DatabaseSeederUtility {
    static _current = new DatabaseSeederUtility();
    static get Current() {
        return DatabaseSeederUtility._current;
    }
    constructor() { }
    static DefaultUsers = [
        {
            FullName: "Yuvraj Gupta (Owner)",
            PhoneNumber: "9876543210",
            PlainPassword: "OwnerPass@123",
            Role: UserRoleEnum_1.UserRoleEnum.Owner,
            IsActive: true
        },
        {
            FullName: "Ramesh Kumar (Staff)",
            PhoneNumber: "9876543211",
            PlainPassword: "StaffPass@123",
            Role: UserRoleEnum_1.UserRoleEnum.Staff,
            IsActive: true
        },
        {
            FullName: "Aarav Sharma (4W Student)",
            PhoneNumber: "9876543212",
            PlainPassword: "StudentPass@123",
            Role: UserRoleEnum_1.UserRoleEnum.Student,
            IsActive: true
        },
        {
            FullName: "Priya Patel (2W Student)",
            PhoneNumber: "9876543213",
            PlainPassword: "StudentPass@123",
            Role: UserRoleEnum_1.UserRoleEnum.Student,
            IsActive: true
        }
    ];
    async SeedAsync(users = DatabaseSeederUtility.DefaultUsers) {
        console.log("\n=======================================================");
        console.log("       SafeDrive Academy - Database Seeder Utility      ");
        console.log("=======================================================\n");
        try {
            await MongoDbConnectionUtility_1.MongoDbConnectionUtility.Current.ConnectAsync();
            console.log(`[DatabaseSeederUtility] Seeding ${users.length} test accounts...\n`);
            for (const user of users) {
                const hashedPassword = await bcryptjs_1.default.hash(user.PlainPassword, 10);
                const updatedUser = await UserModel_1.UserModel.findOneAndUpdate({ PhoneNumber: user.PhoneNumber }, {
                    $set: {
                        FullName: user.FullName,
                        Password: hashedPassword,
                        Role: user.Role,
                        IsActive: user.IsActive
                    }
                }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });
                console.log(`  ? Seeded [${user.Role.toUpperCase()}]:`);
                console.log(`    - Name:     ${updatedUser.FullName}`);
                console.log(`    - Phone:    ${updatedUser.PhoneNumber}`);
                console.log(`    - Password: ${user.PlainPassword}`);
                console.log(`    - User ID:  ${updatedUser._id}\n`);
            }
            console.log("=======================================================");
            console.log("  Database seeding completed successfully!             ");
            console.log("=======================================================\n");
        }
        catch (error) {
            console.error("[DatabaseSeederUtility] Error seeding database:", error);
            throw error;
        }
    }
}
exports.DatabaseSeederUtility = DatabaseSeederUtility;

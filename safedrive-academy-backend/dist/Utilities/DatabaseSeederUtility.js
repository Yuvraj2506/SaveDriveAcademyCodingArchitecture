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
const StudentModel_1 = require("../Models/StudentModel");
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
            // Seed StudentModel entries for student users
            await StudentModel_1.StudentModel.findOneAndUpdate({ PhoneNumber: "9876543212" }, {
                $set: {
                    Name: "Aarav Sharma",
                    PhoneNumber: "9876543212",
                    VehicleType: "4-Wheeler",
                    CoursePackage: "4-Wheeler Personal (120 km Target)",
                    TrainingType: "4w_personal",
                    TargetKm: 120,
                    CompletedKm: 42,
                    TotalDays: 15,
                    CompletedDays: 7,
                    TotalCourseFee: 8500,
                    TotalPaid: 5000,
                    RemainingDue: 3500,
                    AssignedInstructor: "Vikram Singh (Senior Trainer)",
                    PaymentMethod: "UPI",
                    RequestedBy: "Ramesh Kumar (Staff)",
                    RequestedDate: "01 Sep 2026",
                    ApprovedBy: "Yuvraj Gupta (Owner)",
                    ApprovedDate: "01 Sep 2026",
                    Status: StudentModel_1.StudentRequestStatusEnum.Approved,
                    Payments: [
                        {
                            ReceiptNumber: "REC-2026-089",
                            Date: "01 Sep 2026",
                            Method: "UPI",
                            Amount: 5000,
                            RecordedBy: "Ramesh Kumar (Staff)"
                        }
                    ]
                }
            }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });
            await StudentModel_1.StudentModel.findOneAndUpdate({ PhoneNumber: "9876543213" }, {
                $set: {
                    Name: "Priya Patel",
                    PhoneNumber: "9876543213",
                    VehicleType: "2-Wheeler",
                    CoursePackage: "2-Wheeler Gearless Scooty (15 Days)",
                    TrainingType: "2w_scooty",
                    TargetKm: 0,
                    CompletedKm: 0,
                    TotalDays: 15,
                    CompletedDays: 11,
                    TotalCourseFee: 4500,
                    TotalPaid: 4500,
                    RemainingDue: 0,
                    AssignedInstructor: "Pooja Sharma (Trainer)",
                    PaymentMethod: "Cash",
                    RequestedBy: "Ramesh Kumar (Staff)",
                    RequestedDate: "25 Aug 2026",
                    ApprovedBy: "Yuvraj Gupta (Owner)",
                    ApprovedDate: "25 Aug 2026",
                    Status: StudentModel_1.StudentRequestStatusEnum.Approved,
                    Payments: [
                        {
                            ReceiptNumber: "REC-2026-062",
                            Date: "25 Aug 2026",
                            Method: "Cash",
                            Amount: 4500,
                            RecordedBy: "Ramesh Kumar (Staff)"
                        }
                    ]
                }
            }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });
            // Seed sample pending student request
            await StudentModel_1.StudentModel.findOneAndUpdate({ PhoneNumber: "9876543299" }, {
                $set: {
                    Name: "Rohit Verma",
                    PhoneNumber: "9876543299",
                    VehicleType: "4-Wheeler",
                    CoursePackage: "4-Wheeler Personal (120 km Target)",
                    TrainingType: "4w_personal",
                    TargetKm: 120,
                    CompletedKm: 0,
                    TotalDays: 15,
                    CompletedDays: 0,
                    TotalCourseFee: 8500,
                    TotalPaid: 5000,
                    RemainingDue: 3500,
                    AssignedInstructor: "Ramesh Kumar (Staff)",
                    PaymentMethod: "UPI",
                    RequestedBy: "Ramesh Kumar (Staff)",
                    RequestedDate: "06 Sep 2026",
                    Status: StudentModel_1.StudentRequestStatusEnum.Pending,
                    Payments: [
                        {
                            ReceiptNumber: "REC-2026-112",
                            Date: "06 Sep 2026",
                            Method: "UPI",
                            Amount: 5000,
                            RecordedBy: "Ramesh Kumar (Staff)"
                        }
                    ]
                }
            }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });
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

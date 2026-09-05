import bcrypt from "bcryptjs";
import { MongoDbConnectionUtility } from "./MongoDbConnectionUtility";
import { UserModel } from "../Features/Authentication/Models/UserModel";
import { UserRoleEnum } from "../Features/Authentication/Models/UserRoleEnum";

export interface ISeedUser {
  FullName: string;
  PhoneNumber: string;
  PlainPassword: string;
  Role: UserRoleEnum;
  IsActive: boolean;
}

export class DatabaseSeederUtility {
  private static readonly _current: DatabaseSeederUtility = new DatabaseSeederUtility();

  public static get Current(): DatabaseSeederUtility {
    return DatabaseSeederUtility._current;
  }

  private constructor() {}

  public static readonly DefaultUsers: ISeedUser[] = [
    {
      FullName: "Yuvraj Gupta (Owner)",
      PhoneNumber: "9876543210",
      PlainPassword: "OwnerPass@123",
      Role: UserRoleEnum.Owner,
      IsActive: true
    },
    {
      FullName: "Ramesh Kumar (Staff)",
      PhoneNumber: "9876543211",
      PlainPassword: "StaffPass@123",
      Role: UserRoleEnum.Staff,
      IsActive: true
    },
    {
      FullName: "Aarav Sharma (4W Student)",
      PhoneNumber: "9876543212",
      PlainPassword: "StudentPass@123",
      Role: UserRoleEnum.Student,
      IsActive: true
    },
    {
      FullName: "Priya Patel (2W Student)",
      PhoneNumber: "9876543213",
      PlainPassword: "StudentPass@123",
      Role: UserRoleEnum.Student,
      IsActive: true
    }
  ];

  public async SeedAsync(users: ISeedUser[] = DatabaseSeederUtility.DefaultUsers): Promise<void> {
    console.log("\n=======================================================");
    console.log("       SafeDrive Academy - Database Seeder Utility      ");
    console.log("=======================================================\n");

    try {
      await MongoDbConnectionUtility.Current.ConnectAsync();

      console.log(`[DatabaseSeederUtility] Seeding ${users.length} test accounts...\n`);

      for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.PlainPassword, 10);

        const updatedUser = await UserModel.findOneAndUpdate(
          { PhoneNumber: user.PhoneNumber },
          {
            $set: {
              FullName: user.FullName,
              Password: hashedPassword,
              Role: user.Role,
              IsActive: user.IsActive
            }
          },
          { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        );

        console.log(`  ? Seeded [${user.Role.toUpperCase()}]:`);
        console.log(`    - Name:     ${updatedUser.FullName}`);
        console.log(`    - Phone:    ${updatedUser.PhoneNumber}`);
        console.log(`    - Password: ${user.PlainPassword}`);
        console.log(`    - User ID:  ${updatedUser._id}\n`);
      }

      console.log("=======================================================");
      console.log("  Database seeding completed successfully!             ");
      console.log("=======================================================\n");
    } catch (error) {
      console.error("[DatabaseSeederUtility] Error seeding database:", error);
      throw error;
    }
  }
}


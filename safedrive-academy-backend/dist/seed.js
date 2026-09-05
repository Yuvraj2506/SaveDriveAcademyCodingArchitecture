"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ENValidatorUtility_1 = require("./Utilities/ENValidatorUtility");
const DatabaseSeederUtility_1 = require("./Utilities/DatabaseSeederUtility");
const MongoDbConnectionUtility_1 = require("./Utilities/MongoDbConnectionUtility");
async function main() {
    ENValidatorUtility_1.ENValidatorUtility.Current.ValidateAll();
    try {
        await DatabaseSeederUtility_1.DatabaseSeederUtility.Current.SeedAsync();
    }
    catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
    finally {
        await MongoDbConnectionUtility_1.MongoDbConnectionUtility.Current.DisconnectAsync();
        process.exit(0);
    }
}
main();

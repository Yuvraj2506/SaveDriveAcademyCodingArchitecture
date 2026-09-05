import { ENValidatorUtility } from "./Utilities/ENValidatorUtility";
import { DatabaseSeederUtility } from "./Utilities/DatabaseSeederUtility";
import { MongoDbConnectionUtility } from "./Utilities/MongoDbConnectionUtility";

async function main(): Promise<void> {
  ENValidatorUtility.Current.ValidateAll();
  try {
    await DatabaseSeederUtility.Current.SeedAsync();
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await MongoDbConnectionUtility.Current.DisconnectAsync();
    process.exit(0);
  }
}

main();


import {
    createDatabase,
    databaseExists,
    getDatabaseConfig,
    promptYesNo,
    runPackageScript
} from "./dbUtils.js";

async function main() {
    const config = getDatabaseConfig();
    const exists = await databaseExists();

    if (!exists) {
        const shouldCreate = await promptYesNo(
            `Database "${config.database}" does not exist. Create it first?`
        );

        if (!shouldCreate) {
            console.log("Setup cancelled because the database was not created.");
            process.exit(1);
        }

        await createDatabase();
        console.log(`Database "${config.database}" created successfully.`);
    } else {
        console.log(`Database "${config.database}" already exists.`);
    }

    const shouldMigrate = await promptYesNo("Run migrations now?", true);
    if (shouldMigrate) {
        await runPackageScript("db:migrate");
    } else {
        console.log("Skipped migrations.");
    }

    const shouldSeed = await promptYesNo("Run seeders now?", true);
    if (shouldSeed) {
        await runPackageScript("db:seed");
    } else {
        console.log("Skipped seeders.");
    }

    console.log("Database setup finished.");
}

main().catch((error) => {
    console.error("Database setup failed.");
    console.error(error.message);
    process.exit(1);
});

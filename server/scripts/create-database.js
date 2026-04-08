import { createDatabase, databaseExists, getDatabaseConfig, promptYesNo } from "./dbUtils.js";

async function main() {
    const config = getDatabaseConfig();
    const exists = await databaseExists();

    if (exists) {
        console.log(`Database "${config.database}" already exists.`);
        return;
    }

    console.log(`Database "${config.database}" was not found on ${config.host}:${config.port}.`);

    const shouldCreate = await promptYesNo("Create the database now?");
    if (!shouldCreate) {
        console.log("Database creation cancelled.");
        process.exit(1);
    }

    await createDatabase();
    console.log(`Database "${config.database}" created successfully.`);
}

main().catch((error) => {
    console.error("Unable to create the database.");
    console.error(error.message);
    process.exit(1);
});

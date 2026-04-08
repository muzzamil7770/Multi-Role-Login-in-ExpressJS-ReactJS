import { spawn } from "child_process";
import readline from "readline";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export function getDatabaseConfig() {
    return {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "auth_db",
        dialect: process.env.DB_DIALECT || "mysql"
    };
}

export async function withServerConnection(handler) {
    const config = getDatabaseConfig();
    const connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password
    });

    try {
        return await handler(connection, config);
    } finally {
        await connection.end();
    }
}

export async function databaseExists() {
    return withServerConnection(async (connection, config) => {
        const [rows] = await connection.query(
            "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?",
            [config.database]
        );

        return rows.length > 0;
    });
}

export async function createDatabase() {
    return withServerConnection(async (connection, config) => {
        await connection.query(`CREATE DATABASE \`${config.database}\``);
    });
}

export function promptYesNo(question, defaultAnswer = false) {
    const suffix = defaultAnswer ? " [Y/n]: " : " [y/N]: ";
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(`${question}${suffix}`, (answer) => {
            rl.close();
            const normalized = answer.trim().toLowerCase();

            if (!normalized) {
                resolve(defaultAnswer);
                return;
            }

            resolve(normalized === "y" || normalized === "yes");
        });
    });
}

export function runPackageScript(scriptName) {
    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

    return new Promise((resolve, reject) => {
        const child = spawn(npmCommand, ["run", scriptName], {
            stdio: "inherit",
            shell: false
        });

        child.on("exit", (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            reject(new Error(`The script "${scriptName}" exited with code ${code}.`));
        });

        child.on("error", reject);
    });
}

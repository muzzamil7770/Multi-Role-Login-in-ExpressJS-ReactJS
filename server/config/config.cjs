require("dotenv").config();

const sharedConfig = {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "auth_db",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    dialect: process.env.DB_DIALECT || "mysql"
};

module.exports = {
    development: sharedConfig,
    test: sharedConfig,
    production: sharedConfig
};

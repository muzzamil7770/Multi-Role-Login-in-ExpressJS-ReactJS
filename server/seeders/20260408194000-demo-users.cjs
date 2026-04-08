"use strict";

const argon2 = require("argon2");

module.exports = {
    async up(queryInterface) {
        const now = new Date();
        const adminPassword = await argon2.hash("admin123");
        const userPassword = await argon2.hash("user123");

        await queryInterface.bulkInsert("users", [
            {
                uuid: "11111111-1111-4111-8111-111111111111",
                name: "Admin User",
                email: "admin@example.com",
                password: adminPassword,
                role: "admin",
                createdAt: now,
                updatedAt: now
            },
            {
                uuid: "22222222-2222-4222-8222-222222222222",
                name: "Standard User",
                email: "user@example.com",
                password: userPassword,
                role: "user",
                createdAt: now,
                updatedAt: now
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("users", {
            email: {
                [Sequelize.Op.in]: ["admin@example.com", "user@example.com"]
            }
        });
    }
};

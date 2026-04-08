"use strict";

module.exports = {
    async up(queryInterface) {
        const [users] = await queryInterface.sequelize.query(
            "SELECT id, email FROM users WHERE email IN ('admin@example.com', 'user@example.com')"
        );

        const admin = users.find((user) => user.email === "admin@example.com");
        const standardUser = users.find((user) => user.email === "user@example.com");

        if (!admin || !standardUser) {
            throw new Error("Seed users must exist before seeding products.");
        }

        const now = new Date();

        await queryInterface.bulkInsert("product", [
            {
                uuid: "33333333-3333-4333-8333-333333333333",
                name: "Admin Sample Product",
                price: 500,
                userId: admin.id,
                createdAt: now,
                updatedAt: now
            },
            {
                uuid: "44444444-4444-4444-8444-444444444444",
                name: "User Sample Product",
                price: 250,
                userId: standardUser.id,
                createdAt: now,
                updatedAt: now
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("product", {
            uuid: {
                [Sequelize.Op.in]: [
                    "33333333-3333-4333-8333-333333333333",
                    "44444444-4444-4444-8444-444444444444"
                ]
            }
        });
    }
};

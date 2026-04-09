'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_sessions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      uuid: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      deviceInfo: {
        type: Sequelize.STRING,
        allowNull: false
      },
      browser: {
        type: Sequelize.STRING,
        allowNull: true
      },
      os: {
        type: Sequelize.STRING,
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      loginTime: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      lastActivity: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('user_sessions', ['userId']);
    await queryInterface.addIndex('user_sessions', ['uuid']);
    await queryInterface.addIndex('user_sessions', ['isActive']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_sessions');
  }
};

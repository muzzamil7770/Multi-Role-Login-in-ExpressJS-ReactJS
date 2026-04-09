import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const UserSessions = db.define('user_sessions', {
    uuid: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        validate: { notEmpty: true }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true }
    },
    deviceInfo: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true }
    },
    browser: {
        type: DataTypes.STRING,
        allowNull: true
    },
    os: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
    },
    loginTime: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    },
    lastActivity: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    freezeTableName: true
});

export default UserSessions;

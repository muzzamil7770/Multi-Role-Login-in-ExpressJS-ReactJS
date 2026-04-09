import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";

const { DataTypes } = Sequelize;

const Notifications = db.define('notifications', {
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
    type: {
        type: DataTypes.ENUM('login_alert', 'profile_update', 'security', 'system', 'info'),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true }
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    freezeTableName: true
});

Users.hasMany(Notifications, { foreignKey: 'userId' });
Notifications.belongsTo(Users, { foreignKey: 'userId' });

export default Notifications;

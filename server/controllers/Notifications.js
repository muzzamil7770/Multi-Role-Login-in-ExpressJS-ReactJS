import User from '../models/UserModel.js';
import { NotificationService } from '../services/NotificationService.js';

// Get all notifications for current user
export const getNotifications = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { uuid: req.session.userId }
        });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const { page = 1, limit = 20, unreadOnly = false } = req.query;
        const result = await NotificationService.getUserNotifications(user.id, {
            page: parseInt(page),
            limit: parseInt(limit),
            unreadOnly: unreadOnly === 'true'
        });

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { uuid: req.session.userId }
        });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const notification = await NotificationService.markAsRead(req.params.id, user.id);
        res.status(200).json({ msg: "Notification marked as read", notification });
    } catch (error) {
        res.status(404).json({ msg: error.message });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { uuid: req.session.userId }
        });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const result = await NotificationService.markAllAsRead(user.id);
        res.status(200).json({ msg: "All notifications marked as read", ...result });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { uuid: req.session.userId }
        });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const count = await NotificationService.getUnreadCount(user.id);
        res.status(200).json({ unreadCount: count });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Delete notification
export const deleteNotification = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { uuid: req.session.userId }
        });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const result = await NotificationService.deleteNotification(req.params.id, user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({ msg: error.message });
    }
};

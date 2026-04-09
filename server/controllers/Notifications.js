import User from '../models/UserModel.js';
import { NotificationService } from '../services/NotificationService.js';
import { asyncHandler, AppError } from '../middleware/ErrorHandler.js';

// Get all notifications for current user
export const getNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const result = await NotificationService.getUserNotifications(req.userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        unreadOnly: unreadOnly === 'true'
    });

    res.status(200).json(result);
});

// Mark notification as read
export const markAsRead = asyncHandler(async (req, res) => {
    const notification = await NotificationService.markAsRead(req.params.id, req.userId);
    res.status(200).json({ msg: "Notification marked as read", notification });
});

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req, res) => {
    const result = await NotificationService.markAllAsRead(req.userId);
    res.status(200).json({ msg: "All notifications marked as read", ...result });
});

// Get unread count
export const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await NotificationService.getUnreadCount(req.userId);
    res.status(200).json({ unreadCount: count });
});

// Delete notification
export const deleteNotification = asyncHandler(async (req, res) => {
    const result = await NotificationService.deleteNotification(req.params.id, req.userId);
    res.status(200).json(result);
});

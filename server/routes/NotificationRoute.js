import express from "express";
import { verifyUser } from "../middleware/AuthUser.js";
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount, deleteNotification } from "../controllers/Notifications.js";

const router = express.Router();

// Notification routes (require authentication)
router.get('/notifications', verifyUser, getNotifications);
router.get('/notifications/unread-count', verifyUser, getUnreadCount);
router.put('/notifications/:id/read', verifyUser, markAsRead);
router.put('/notifications/read-all', verifyUser, markAllAsRead);
router.delete('/notifications/:id', verifyUser, deleteNotification);

export default router;

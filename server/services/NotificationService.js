import Notifications from '../models/NotificationModel.js';
import UserSessions from '../models/UserSessionModel.js';
import { Op } from 'sequelize';
import { sendLoginAlertEmail, sendProfileUpdateEmail, sendSecurityAlertEmail } from '../services/EmailService.js';

// Notification service for managing user alerts
class NotificationService {
    // Create a new notification
    static async createNotification(userId, type, title, message, metadata = {}) {
        try {
            const notification = await Notifications.create({
                userId,
                type,
                title,
                message,
                metadata
            });

            // Emit via Socket.io if available
            if (global.io) {
                global.io.to(`user_${userId}`).emit('notification', {
                    uuid: notification.uuid,
                    type,
                    title,
                    message,
                    isRead: false,
                    createdAt: notification.createdAt
                });
            }

            return notification;
        } catch (error) {
            console.error('Failed to create notification:', error);
            throw error;
        }
    }

    // Get notifications for a user
    static async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
        try {
            const offset = (page - 1) * limit;
            const where = { userId };
            if (unreadOnly) where.isRead = false;

            const { count, rows } = await Notifications.findAndCountAll({
                where,
                order: [['createdAt', 'DESC']],
                limit,
                offset
            });

            return {
                notifications: rows,
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            };
        } catch (error) {
            console.error('Failed to get notifications:', error);
            throw error;
        }
    }

    // Mark notification as read
    static async markAsRead(notificationUuid, userId) {
        try {
            const notification = await Notifications.findOne({
                where: { uuid: notificationUuid, userId }
            });

            if (!notification) {
                throw new Error('Notification not found');
            }

            await notification.update({ isRead: true });
            return notification;
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            throw error;
        }
    }

    // Mark all notifications as read
    static async markAllAsRead(userId) {
        try {
            const [affectedCount] = await Notifications.update(
                { isRead: true },
                { where: { userId, isRead: false } }
            );

            // Emit via Socket.io
            if (global.io) {
                global.io.to(`user_${userId}`).emit('notifications_read_all');
            }

            return { affectedCount };
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
            throw error;
        }
    }

    // Get unread count
    static async getUnreadCount(userId) {
        try {
            const count = await Notifications.count({
                where: { userId, isRead: false }
            });
            return count;
        } catch (error) {
            console.error('Failed to get unread count:', error);
            throw error;
        }
    }

    // Delete notification
    static async deleteNotification(uuid, userId) {
        try {
            const notification = await Notifications.findOne({
                where: { uuid, userId }
            });

            if (!notification) {
                throw new Error('Notification not found');
            }

            await notification.destroy();
            return { msg: 'Notification deleted' };
        } catch (error) {
            console.error('Failed to delete notification:', error);
            throw error;
        }
    }
}

// Session management service
class SessionService {
    // Create a new session
    static async createSession(userId, req) {
        try {
            const userAgent = req.headers['user-agent'] || 'Unknown';
            const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
            
            // Parse browser and OS from user agent
            const { browser, os } = parseUserAgent(userAgent);

            const session = await UserSessions.create({
                userId,
                deviceInfo: `${browser} on ${os}`,
                browser,
                os,
                ipAddress,
                userAgent,
                isActive: true
            });

            return session;
        } catch (error) {
            console.error('Failed to create session:', error);
            throw error;
        }
    }

    // Get all active sessions for a user
    static async getUserSessions(userId, currentSessionId = null) {
        try {
            const sessions = await UserSessions.findAll({
                where: { userId, isActive: true },
                order: [['loginTime', 'DESC']]
            });

            return sessions.map(session => ({
                ...session.toJSON(),
                isCurrent: session.uuid === currentSessionId
            }));
        } catch (error) {
            console.error('Failed to get user sessions:', error);
            throw error;
        }
    }

    // Update last activity
    static async updateActivity(sessionUuid) {
        try {
            const session = await UserSessions.findOne({ where: { uuid: sessionUuid } });
            if (session) {
                await session.update({ lastActivity: new Date() });
            }
        } catch (error) {
            console.error('Failed to update activity:', error);
        }
    }

    // Deactivate session
    static async deactivateSession(uuid, userId) {
        try {
            const session = await UserSessions.findOne({
                where: { uuid, userId }
            });

            if (!session) {
                throw new Error('Session not found');
            }

            await session.update({ isActive: false });
            return { msg: 'Session terminated' };
        } catch (error) {
            console.error('Failed to deactivate session:', error);
            throw error;
        }
    }

    // Deactivate all sessions except current
    static async deactivateAllExcept(currentUuid, userId) {
        try {
            const [affectedCount] = await UserSessions.update(
                { isActive: false },
                { where: { userId, uuid: { [Op.ne]: currentUuid } } }
            );

            return { msg: 'All other sessions terminated', affectedCount };
        } catch (error) {
            console.error('Failed to deactivate sessions:', error);
            throw error;
        }
    }

    // Send login alert email and notification
    static async handleNewLogin(user, req) {
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
        const { browser, os } = parseUserAgent(userAgent);

        const deviceData = {
            device: `${browser} on ${os}`,
            browser,
            os,
            time: new Date().toLocaleString(),
            ipAddress
        };

        // Create notification
        await NotificationService.createNotification(
            user.id,
            'login_alert',
            'New Login Detected',
            `Your account was accessed from a new device: ${browser} on ${os}`,
            deviceData
        );

        // Send email (only if email is configured)
        if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your-email@gmail.com') {
            await sendLoginAlertEmail(user, deviceData).catch(err => {
                console.error('Login alert email failed:', err.message);
            });
        }
    }
}

// Helper function to parse user agent
function parseUserAgent(userAgent) {
    let browser = 'Unknown';
    let os = 'Unknown';

    if (userAgent) {
        // Detect browser
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
        else if (userAgent.includes('Edg')) browser = 'Edge';
        else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';

        // Detect OS
        if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Mac OS')) os = 'macOS';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('Android')) os = 'Android';
        else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'iOS';
    }

    return { browser, os };
}

export { NotificationService, SessionService };

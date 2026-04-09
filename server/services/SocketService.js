import { Server } from 'socket.io';
import { NotificationService, SessionService } from '../services/NotificationService.js';

let io;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Make io globally accessible for emitting from services
    global.io = io;

    io.on('connection', (socket) => {
        console.log('🔌 Client connected:', socket.id);

        // Join user to their personal room
        socket.on('authenticate', (userId) => {
            if (userId) {
                socket.join(`user_${userId}`);
                socket.userId = userId;
                console.log(`✅ User ${userId} authenticated on socket ${socket.id}`);
            }
        });

        // Handle marking notification as read
        socket.on('mark_notification_read', async (notificationId) => {
            try {
                await NotificationService.markAsRead(notificationId, socket.userId);
                socket.emit('notification_marked', { notificationId });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('❌ Client disconnected:', socket.id);
            if (socket.userId) {
                SessionService.updateActivity(socket.userId).catch(err => {
                    console.error('Failed to update activity on disconnect:', err);
                });
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initializeSocket first.');
    }
    return io;
};

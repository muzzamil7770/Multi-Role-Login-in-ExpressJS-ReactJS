import User from "../models/UserModel.js";
import UserSessions from "../models/UserSessionModel.js";
import argon2 from "argon2";
import { NotificationService, SessionService } from '../services/NotificationService.js';
import { sendProfileUpdateEmail, sendPasswordChangeEmail } from '../services/EmailService.js';
import { asyncHandler, AppError } from '../middleware/ErrorHandler.js';

// Get current user profile with complete details
export const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findOne({
        where: { id: req.userId },
        attributes: ['id', 'uuid', 'name', 'email', 'role', 'createdAt', 'updatedAt']
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    const unreadCount = await NotificationService.getUnreadCount(user.id);

    res.status(200).json({
        user: {
            uuid: user.uuid,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        },
        unreadNotifications: unreadCount
    });
});

// Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findOne({
        where: { id: req.userId }
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    const { name, email, password, confPassword } = req.body;
    const updatedFields = [];

    // Validate email format if provided
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new AppError("Invalid email format", 400);
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser && existingUser.uuid !== user.uuid) {
            throw new AppError("Email already in use", 400);
        }
    }

    // Update name if provided
    if (name && name !== user.name) {
        if (name.length < 3 || name.length > 100) {
            throw new AppError("Name must be between 3 and 100 characters", 400);
        }
        user.name = name;
        updatedFields.push('Name');
    }

    // Update email if provided
    if (email && email !== user.email) {
        user.email = email;
        updatedFields.push('Email');
    }

    // Update password if provided
    if (password) {
        if (password.length < 6) {
            throw new AppError("Password must be at least 6 characters", 400);
        }

        if (password !== confPassword) {
            throw new AppError("Password and confirm password do not match", 400);
        }

        user.password = await argon2.hash(password);
        updatedFields.push('Password');

        // Send password change email (non-blocking)
        if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your-email@gmail.com') {
            sendPasswordChangeEmail(user, req.headers['user-agent']).catch(err => {
                console.error('Password change email failed:', err.message);
            });
        }
    }

    await user.save();

    // Create notification for profile update
    await NotificationService.createNotification(
        user.id,
        'profile_update',
        'Profile Updated',
        'Your profile has been updated successfully.',
        { updatedFields }
    );

    // Send profile update email (non-blocking)
    if (updatedFields.length > 0 && !updatedFields.includes('Password')) {
        if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your-email@gmail.com') {
            sendProfileUpdateEmail(user, updatedFields).catch(err => {
                console.error('Profile update email failed:', err.message);
            });
        }
    }

    res.status(200).json({
        msg: "Profile updated successfully",
        user: {
            uuid: user.uuid,
            name: user.name,
            email: user.email,
            role: user.role,
            updatedAt: user.updatedAt
        }
    });
});

// Delete user account
export const deleteAccount = asyncHandler(async (req, res) => {
    const user = await User.findOne({
        where: { id: req.userId }
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    // Deactivate all user sessions
    await UserSessions.update(
        { isActive: false },
        { where: { userId: user.id } }
    );

    // Create security notification
    await NotificationService.createNotification(
        user.id,
        'security',
        'Account Deleted',
        'Your account has been permanently deleted.',
        { deletedAt: new Date().toISOString() }
    );

    // Delete the user
    await user.destroy();

    // Destroy session
    req.session.destroy((err) => {
        if (err) {
            throw new AppError("Error destroying session", 500);
        }
        res.status(200).json({ msg: "Account deleted successfully" });
    });
});

// Get active sessions for current user
export const getSessions = asyncHandler(async (req, res) => {
    const sessions = await SessionService.getUserSessions(req.userId, req.userUuid);
    res.status(200).json(sessions);
});

// Terminate specific session
export const terminateSession = asyncHandler(async (req, res) => {
    const result = await SessionService.deactivateSession(req.params.id, req.userId);
    res.status(200).json(result);
});

// Terminate all other sessions
export const terminateAllSessions = asyncHandler(async (req, res) => {
    const result = await SessionService.deactivateAllExcept(req.userUuid, req.userId);
    res.status(200).json(result);
});

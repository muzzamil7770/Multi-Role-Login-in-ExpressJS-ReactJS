import User from "../models/UserModel.js";
import UserSessions from "../models/UserSessionModel.js";
import argon2 from "argon2";
import { NotificationService, SessionService } from '../services/NotificationService.js';
import { sendProfileUpdateEmail, sendPasswordChangeEmail } from '../services/EmailService.js';

// Get current user profile with complete details
export const getProfile = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { uuid: req.session.userId },
            attributes: ['uuid', 'name', 'email', 'role', 'createdAt', 'updatedAt']
        });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Get unread notification count
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
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { uuid: req.session.userId }
        });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const { name, email, password, confPassword } = req.body;
        const updatedFields = [];

        // Validate email format if provided
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ msg: "Invalid email format" });
            }

            // Check if email is already taken by another user
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser && existingUser.uuid !== user.uuid) {
                return res.status(400).json({ msg: "Email already in use" });
            }
        }

        // Update name if provided
        if (name && name !== user.name) {
            if (name.length < 3 || name.length > 100) {
                return res.status(400).json({ msg: "Name must be between 3 and 100 characters" });
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
                return res.status(400).json({ msg: "Password must be at least 6 characters" });
            }

            if (password !== confPassword) {
                return res.status(400).json({ msg: "Password and confirm password do not match" });
            }

            user.password = await argon2.hash(password);
            updatedFields.push('Password');

            // Send password change email
            if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your-email@gmail.com') {
                await sendPasswordChangeEmail(user, req.headers['user-agent']).catch(err => {
                    console.error('Password change email failed:', err.message);
                });
            }
        }

        // Save changes
        await user.save();

        // Create notification for profile update
        await NotificationService.createNotification(
            user.id,
            'profile_update',
            'Profile Updated',
            `Your profile has been updated successfully.`,
            { updatedFields }
        );

        // Send profile update email if fields other than password were updated
        if (updatedFields.length > 0 && !updatedFields.includes('Password')) {
            if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your-email@gmail.com') {
                await sendProfileUpdateEmail(user, updatedFields).catch(err => {
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
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// Delete user account
export const deleteAccount = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { uuid: req.session.userId }
        });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Delete all user sessions
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
                return res.status(500).json({ msg: "Error destroying session" });
            }
            res.status(200).json({ msg: "Account deleted successfully" });
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Get active sessions for current user
export const getSessions = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { uuid: req.session.userId }
        });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const sessions = await SessionService.getUserSessions(user.id, req.session.userId);
        res.status(200).json(sessions);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Terminate specific session
export const terminateSession = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { uuid: req.session.userId }
        });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const result = await SessionService.deactivateSession(req.params.id, user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// Terminate all other sessions
export const terminateAllSessions = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { uuid: req.session.userId }
        });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const result = await SessionService.deactivateAllExcept(req.session.userId, user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

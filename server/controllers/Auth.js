import User from "../models/UserModel.js";
import UserSessions from "../models/UserSessionModel.js";
import argon2 from "argon2";
import { SessionService } from '../services/NotificationService.js';
import { asyncHandler, AppError } from '../middleware/ErrorHandler.js';

// Registers a new user with complete details and returns the created user data.
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, confPassword, role } = req.body;

    if (!name || !email || !password) {
        throw new AppError("All fields are required", 400);
    }

    if (password !== confPassword) {
        throw new AppError("Password and confirm password do not match", 400);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        throw new AppError("Email already registered", 400);
    }

    const hashPassword = await argon2.hash(password);

    const newUser = await User.create({
        name,
        email,
        password: hashPassword,
        role: role || 'user'
    });

    res.status(201).json({
        msg: "Registration successful",
        user: {
            uuid: newUser.uuid,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.createdAt
        }
    });
});

// Authenticates a user, starts a session, and returns complete profile data.
export const Login = asyncHandler(async (req, res) =>{
    const user = await User.findOne({
        where: {
            email: req.body.email
        }
    });
    if(!user) throw new AppError("User not found", 404);
    
    const match = await argon2.verify(user.password, req.body.password);
    if(!match) throw new AppError("Incorrect password", 400);
    
    req.session.userId = user.uuid;
    
    // Create session track
    await SessionService.createSession(user.id, req);
    
    // Handle new login alert (email + notification)
    SessionService.handleNewLogin(user, req).catch(err => {
        console.error('Login alert handler failed:', err.message);
    });
    
    res.status(200).json({
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
    });
});

// Returns the currently logged-in user's profile using the session id.
export const Me = asyncHandler(async (req, res) =>{
    if(!req.session.userId){
        throw new AppError("Please log in to your account!", 401);
    }
    const user = await User.findOne({
        attributes:['uuid','name','email','role','createdAt'],
        where: {
            uuid: req.session.userId
        }
    });
    if(!user) throw new AppError("User not found", 404);
    res.status(200).json(user);
});

// Destroys the active session and logs the user out.
export const logOut = (req, res) =>{
    req.session.destroy((err)=>{
        if(err) throw new AppError("Unable to log out", 400);
        res.status(200).json({msg: "You have been logged out"});
    });
};

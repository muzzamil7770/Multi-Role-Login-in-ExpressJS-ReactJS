import User from "../models/UserModel.js";
import argon2 from "argon2";
import { asyncHandler, AppError } from '../middleware/ErrorHandler.js';

// Retrieves all users with limited public fields.
export const getUsers = asyncHandler(async (req, res) => {
    const response = await User.findAll({
        attributes: ['uuid', 'name', 'email', 'role']
    });
    res.status(200).json(response);
});

// Retrieves a single user by UUID.
export const getUserById = asyncHandler(async (req, res) => {
    const response = await User.findOne({
        attributes: ['uuid', 'name', 'email', 'role'],
        where: { uuid: req.params.id }
    });
    if (!response) throw new AppError("User not found", 404);
    res.status(200).json(response);
});

// Creates a new user after validating the password confirmation.
export const createUser = asyncHandler(async (req, res) => {
    const { name, email, password, confPassword, role } = req.body;
    
    if (password !== confPassword) {
        throw new AppError("Password and confirm password do not match", 400);
    }
    
    const hashPassword = await argon2.hash(password);
    await User.create({
        name,
        email,
        password: hashPassword,
        role
    });
    res.status(201).json({ msg: "Registration successful" });
});

// Updates an existing user's details and optionally replaces the password.
export const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findOne({
        where: { uuid: req.params.id }
    });
    if (!user) throw new AppError("User not found", 404);
    
    const { name, email, password, confPassword, role } = req.body;
    let hashPassword;
    
    if (password === "" || password === null) {
        hashPassword = user.password;
    } else {
        if (password !== confPassword) {
            throw new AppError("Password and confirm password do not match", 400);
        }
        hashPassword = await argon2.hash(password);
    }
    
    await User.update({
        name,
        email,
        password: hashPassword,
        role
    }, {
        where: { id: user.id }
    });
    res.status(200).json({ msg: "User updated successfully" });
});

// Deletes a user record by UUID.
export const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findOne({
        where: { uuid: req.params.id }
    });
    if (!user) throw new AppError("User not found", 404);
    
    await User.destroy({
        where: { id: user.id }
    });
    res.status(200).json({ msg: "User deleted successfully" });
});

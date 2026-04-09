import Product from "../models/ProductModel.js";
import User from "../models/UserModel.js";
import { asyncHandler, AppError } from '../middleware/ErrorHandler.js';

// Returns products based on the current user's role and ownership.
export const getProducts = asyncHandler(async (req, res) => {
    let response;
    if (req.role === "admin") {
        response = await Product.findAll({
            attributes: ['uuid', 'name', 'price'],
            include: [{
                model: User,
                attributes: ['name', 'email']
            }]
        });
    } else {
        response = await Product.findAll({
            attributes: ['uuid', 'name', 'price'],
            where: { userId: req.userId },
            include: [{
                model: User,
                attributes: ['name', 'email']
            }]
        });
    }
    res.status(200).json(response);
});

// Retrieves one product by UUID with role-based access rules.
export const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findOne({
        where: { uuid: req.params.id }
    });
    if (!product) throw new AppError("Data not found", 404);
    
    let response;
    if (req.role === "admin") {
        response = await Product.findOne({
            attributes: ['uuid', 'name', 'price'],
            where: { id: product.id },
            include: [{
                model: User,
                attributes: ['name', 'email']
            }]
        });
    } else {
        const { Op } = await import('sequelize');
        response = await Product.findOne({
            attributes: ['uuid', 'name', 'price'],
            where: { id: product.id, userId: req.userId },
            include: [{
                model: User,
                attributes: ['name', 'email']
            }]
        });
    }
    res.status(200).json(response);
});

// Creates a new product for the authenticated user.
export const createProduct = asyncHandler(async (req, res) => {
    const { name, price } = req.body;
    await Product.create({
        name,
        price,
        userId: req.userId
    });
    res.status(201).json({ msg: "Product created successfully" });
});

// Updates a product if the current user is allowed to modify it.
export const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findOne({
        where: { uuid: req.params.id }
    });
    if (!product) throw new AppError("Data not found", 404);
    
    const { name, price } = req.body;
    if (req.role === "admin") {
        await Product.update({ name, price }, {
            where: { id: product.id }
        });
    } else {
        if (req.userId !== product.userId) throw new AppError("Access forbidden", 403);
        await Product.update({ name, price }, {
            where: { id: product.id, userId: req.userId }
        });
    }
    res.status(200).json({ msg: "Product updated successfully" });
});

// Deletes a product if the current user is allowed to remove it.
export const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findOne({
        where: { uuid: req.params.id }
    });
    if (!product) throw new AppError("Data not found", 404);
    
    if (req.role === "admin") {
        await Product.destroy({
            where: { id: product.id }
        });
    } else {
        if (req.userId !== product.userId) throw new AppError("Access forbidden", 403);
        await Product.destroy({
            where: { id: product.id, userId: req.userId }
        });
    }
    res.status(200).json({ msg: "Product deleted successfully" });
});

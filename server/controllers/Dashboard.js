import User from "../models/UserModel.js";
import Product from "../models/ProductModel.js";
import { asyncHandler, AppError } from '../middleware/ErrorHandler.js';

// Returns comprehensive dashboard statistics including user counts, role percentages, 
// product counts, and user details for the authenticated user.
export const getDashboardStats = asyncHandler(async (req, res) => {
    const currentUser = await User.findOne({
        where: { id: req.userId },
        attributes: ['uuid', 'name', 'email', 'role', 'createdAt']
    });

    if (!currentUser) {
        throw new AppError("User not found", 404);
    }

    // Get total counts
    const totalUsers = await User.count();
    const totalProducts = await Product.count();

    // Get role distribution
    const adminCount = await User.count({ where: { role: 'admin' } });
    const userCount = await User.count({ where: { role: 'user' } });

    // Calculate role percentages
    const adminPercentage = totalUsers > 0 ? Math.round((adminCount / totalUsers) * 100) : 0;
    const userPercentage = totalUsers > 0 ? Math.round((userCount / totalUsers) * 100) : 0;

    // Get recent users (last 5)
    const recentUsers = await User.findAll({
        attributes: ['uuid', 'name', 'email', 'role', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 5
    });

    // Get product ownership distribution
    const productsByRole = await Product.findAll({
        include: [{
            model: User,
            attributes: ['role']
        }],
        attributes: []
    });

    const adminProducts = productsByRole.filter(p => p.User?.role === 'admin').length;
    const userProducts = productsByRole.filter(p => p.User?.role === 'user').length;
    const adminProductPercentage = totalProducts > 0 ? Math.round((adminProducts / totalProducts) * 100) : 0;
    const userProductPercentage = totalProducts > 0 ? Math.round((userProducts / totalProducts) * 100) : 0;

    res.status(200).json({
        user: {
            uuid: currentUser.uuid,
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
            createdAt: currentUser.createdAt
        },
        stats: {
            totalUsers,
            totalProducts,
            roleDistribution: {
                admin: { count: adminCount, percentage: adminPercentage },
                user: { count: userCount, percentage: userPercentage }
            },
            productDistribution: {
                adminProducts: { count: adminProducts, percentage: adminProductPercentage },
                userProducts: { count: userProducts, percentage: userProductPercentage }
            }
        },
        recentUsers
    });
});

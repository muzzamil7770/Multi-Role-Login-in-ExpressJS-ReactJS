import express from "express";
import { verifyUser } from "../middleware/AuthUser.js";
import { getDashboardStats } from "../controllers/Dashboard.js";

const router = express.Router();

// All authenticated users can access dashboard stats
router.get('/dashboard', verifyUser, getDashboardStats);

export default router;

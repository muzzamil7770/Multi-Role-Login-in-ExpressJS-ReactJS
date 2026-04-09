import express from "express";
import { registerUser } from "../controllers/Auth.js";

const router = express.Router();

// Public registration endpoint
router.post('/register', registerUser);

export default router;

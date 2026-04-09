import express from "express";
import { verifyUser } from "../middleware/AuthUser.js";
import { getProfile, updateProfile, deleteAccount, getSessions, terminateSession, terminateAllSessions } from "../controllers/Profile.js";

const router = express.Router();

// Profile routes (require authentication)
router.get('/profile', verifyUser, getProfile);
router.put('/profile', verifyUser, updateProfile);
router.delete('/profile', verifyUser, deleteAccount);

// Session management routes
router.get('/sessions', verifyUser, getSessions);
router.delete('/sessions/:id', verifyUser, terminateSession);
router.delete('/sessions', verifyUser, terminateAllSessions);

export default router;

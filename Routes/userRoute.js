import express from "express";
import {
    registerUser, loginUser, getUserProfile, getAllUsers,
    forgotPassword, verifyOTP, resetPasswordWithOTP, changePassword
} from "../Controller/userController.js"
import authMiddleware from "../Middleware/auth.js";

const router = express.Router();

// Auth
router.post("/register", registerUser);
router.post("/login", loginUser);

// Password Management (OTP-based)
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password-otp", resetPasswordWithOTP);
router.put("/change-password", authMiddleware(["user", "admin", "superadmin"]), changePassword);

// User
router.get("/profile", authMiddleware(["user"]), getUserProfile);

// Admin
router.get("/", authMiddleware(["admin", "superadmin"]), getAllUsers);

export default router;

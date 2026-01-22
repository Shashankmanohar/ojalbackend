import { Router } from "express";
import { adminRegister, adminLogin } from "../Controller/adminController.js";
import authMiddleware from "../Middleware/auth.js";

const router = Router();

// Only superadmin can create admins
router.post(
  "/register",
  authMiddleware(["superadmin"]),
  adminRegister
);

// Login is public
router.post("/login", adminLogin);

export default router;

import express from "express";
import {
    createOrder,
    verifyPayment,
    getUserOrders,
    getOrderById,
    cancelOrder,
    getAllOrders,
    updateOrderStatus,
} from "../Controller/orderController.js";
import authMiddleware from "../Middleware/auth.js";

const router = express.Router();

// User routes (require authentication)
router.post("/create", authMiddleware(["user"]), createOrder);
router.post("/verify-payment", authMiddleware(["user"]), verifyPayment);
router.get("/my-orders", authMiddleware(["user"]), getUserOrders);
router.get("/:orderId", authMiddleware(["user"]), getOrderById);
router.put("/:orderId/cancel", authMiddleware(["user"]), cancelOrder);

// Admin routes
router.get("/", authMiddleware(["admin", "superadmin"]), getAllOrders);
router.put("/:orderId/status", authMiddleware(["admin", "superadmin"]), updateOrderStatus);

export default router;

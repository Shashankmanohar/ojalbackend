import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../Models/orderModel.js";
import Product from "../Models/productModel.js";
import User from "../Models/userModel.js";
import {
    sendEmail,
    getOrderConfirmationEmailTemplate,
    getOrderCancellationEmailTemplate,
} from "../Config/emailConfig.js";

// Initialize Razorpay instance
let razorpay;
try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || 
        process.env.RAZORPAY_KEY_ID === 'your_razorpay_key_id' || 
        process.env.RAZORPAY_KEY_SECRET === 'your_razorpay_key_secret') {
        console.warn("⚠️ Razorpay keys not configured. Payment integration will not work.");
        razorpay = null;
    } else {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
} catch (error) {
    console.error("Failed to initialize Razorpay:", error);
    razorpay = null;
}

// Create Order
export const createOrder = async (req, res) => {
    try {
        const { items, shippingAddress } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!items || items.length === 0) {
            return res.status(400).json({ message: "No items in the order" });
        }

        if (!shippingAddress) {
            return res.status(400).json({ message: "Shipping address is required" });
        }

        // Validate and fetch product details
        const orderItems = [];
        let itemsPrice = 0;

        for (const item of items) {
            const product = await Product.findById(item.product);

            if (!product) {
                return res.status(404).json({
                    message: `Product not found: ${item.product}`,
                });
            }

            if (!product.isActive) {
                return res.status(400).json({
                    message: `Product is not available: ${product.title}`,
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for ${product.title}. Available: ${product.stock}`,
                });
            }

            const orderItem = {
                product: product._id,
                title: product.title,
                price: product.price,
                quantity: item.quantity,
                image: product.images[0]?.cloudinaryUrl || "",
            };

            orderItems.push(orderItem);
            itemsPrice += product.price * item.quantity;
        }

        // Calculate pricing
        const taxPrice = itemsPrice * 0.18; // 18% GST
        const shippingPrice = itemsPrice > 500 ? 0 : 50; // Free shipping above ₹500
        const totalPrice = itemsPrice + taxPrice + shippingPrice;

        // Check if Razorpay is configured
        if (!razorpay) {
            return res.status(500).json({
                message: "Payment gateway not configured. Please contact administrator.",
                error: "Razorpay keys are missing or invalid"
            });
        }

        // Create Razorpay order
        let razorpayOrder;
        try {
            razorpayOrder = await razorpay.orders.create({
                amount: Math.round(totalPrice * 100), // Amount in paise
                currency: "INR",
                receipt: `order_${Date.now()}`,
                notes: {
                    userId: userId,
                },
            });
        } catch (razorpayError) {
            console.error("Razorpay order creation error:", razorpayError);
            return res.status(500).json({
                message: "Failed to initialize payment. Please check Razorpay configuration.",
                error: razorpayError.message || "Razorpay API error"
            });
        }

        // Create order in database
        const order = await Order.create({
            user: userId,
            orderItems,
            shippingAddress,
            paymentInfo: {
                razorpayOrderId: razorpayOrder.id,
                paymentStatus: "pending",
            },
            pricing: {
                itemsPrice: parseFloat(itemsPrice.toFixed(2)),
                taxPrice: parseFloat(taxPrice.toFixed(2)),
                shippingPrice: parseFloat(shippingPrice.toFixed(2)),
                totalPrice: parseFloat(totalPrice.toFixed(2)),
            },
            orderStatus: "pending",
        });

        // Return order with minimal data needed by frontend
        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order: {
                _id: order._id.toString(),
            },
            razorpayOrderId: razorpayOrder.id,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error("Create order error:", error);
        console.error("Error stack:", error.stack);
        console.error("Request body:", { items: req.body.items, shippingAddress: req.body.shippingAddress });
        res.status(500).json({
            message: "Failed to create order",
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
};

// Verify Payment and Update Order
export const verifyPayment = async (req, res) => {
    try {
        const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const userId = req.user.id;

        // Find the order
        const order = await Order.findById(orderId).populate("user");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Verify order belongs to user
        if (order.user._id.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized access to order" });
        }

        // Verify Razorpay signature
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            // Payment verification failed
            order.paymentInfo.paymentStatus = "failed";
            await order.save();

            return res.status(400).json({
                success: false,
                message: "Payment verification failed",
            });
        }

        // Payment verified successfully
        order.paymentInfo.razorpayPaymentId = razorpay_payment_id;
        order.paymentInfo.razorpaySignature = razorpay_signature;
        order.paymentInfo.paymentStatus = "completed";
        order.orderStatus = "confirmed";
        await order.save();

        // Update product stock
        for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity },
            });
        }

        // Send order confirmation email
        try {
            const emailHtml = getOrderConfirmationEmailTemplate(order, order.user.name);
            await sendEmail({
                email: order.user.email,
                subject: `Order Confirmed - ${order._id}`,
                html: emailHtml,
            });
        } catch (emailError) {
            console.error("Failed to send order confirmation email:", emailError);
            // Don't fail the order if email fails
        }

        res.status(200).json({
            success: true,
            message: "Payment verified and order confirmed",
            order,
        });
    } catch (error) {
        console.error("Verify payment error:", error);
        res.status(500).json({
            message: "Failed to verify payment",
            error: error.message,
        });
    }
};

// Get User Orders
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const orders = await Order.find({ user: userId })
            .populate("orderItems.product", "title price images")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        console.error("Get user orders error:", error);
        res.status(500).json({
            message: "Failed to fetch orders",
            error: error.message,
        });
    }
};

// Get Single Order
export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        const order = await Order.findById(orderId)
            .populate("orderItems.product", "title price images category")
            .populate("user", "name email");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Verify order belongs to user
        if (order.user._id.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized access to order" });
        }

        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        console.error("Get order error:", error);
        res.status(500).json({
            message: "Failed to fetch order",
            error: error.message,
        });
    }
};

// Cancel Order
export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;
        const { reason } = req.body;

        const order = await Order.findById(orderId).populate("user");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Verify order belongs to user
        if (order.user._id.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized access to order" });
        }

        // Check if order can be cancelled
        if (order.orderStatus === "cancelled") {
            return res.status(400).json({ message: "Order is already cancelled" });
        }

        if (order.orderStatus === "shipped" || order.orderStatus === "delivered") {
            return res.status(400).json({
                message: `Cannot cancel order. Order is already ${order.orderStatus}`,
            });
        }

        // Update order status
        order.orderStatus = "cancelled";
        order.cancelledAt = new Date();
        order.cancellationReason = reason || "Cancelled by user";
        await order.save();

        // Restore product stock
        for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity },
            });
        }

        // Send cancellation email
        try {
            const emailHtml = getOrderCancellationEmailTemplate(order, order.user.name);
            await sendEmail({
                email: order.user.email,
                subject: `Order Cancelled - ${order._id}`,
                html: emailHtml,
            });
        } catch (emailError) {
            console.error("Failed to send cancellation email:", emailError);
            // Don't fail the cancellation if email fails
        }

        res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            order,
        });
    } catch (error) {
        console.error("Cancel order error:", error);
        res.status(500).json({
            message: "Failed to cancel order",
            error: error.message,
        });
    }
};

// Get All Orders (Admin only)
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "name email")
            .populate("orderItems.product", "title price")
            .sort({ createdAt: -1 });

        const totalAmount = orders.reduce((sum, order) => sum + order.pricing.totalPrice, 0);

        res.status(200).json({
            success: true,
            count: orders.length,
            totalAmount,
            orders,
        });
    } catch (error) {
        console.error("Get all orders error:", error);
        res.status(500).json({
            message: "Failed to fetch orders",
            error: error.message,
        });
    }
};

// Update Order Status (Admin only)
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid order status" });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        order.orderStatus = status;

        if (status === "delivered") {
            order.deliveryDate = new Date();
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order,
        });
    } catch (error) {
        console.error("Update order status error:", error);
        res.status(500).json({
            message: "Failed to update order status",
            error: error.message,
        });
    }
};

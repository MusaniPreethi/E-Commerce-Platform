import express, { Router } from "express";
import { createOrder, getOrdersByUser, deleteOrderById } from "../controllers/orderController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

// Create new order
router.post("/create", requireAuth, createOrder);

// Get orders by user
router.get("/user/:userId", requireAuth, getOrdersByUser);

// Delete an order
router.delete("/:orderId", requireAuth, deleteOrderById);

// Get all orders (admin or testing)
router.get("/", async (req, res) => {
  try {
    const orders = await getAllOrders(); // implement in controller
    res.json(
      orders.map(order => ({
        id: order._id,
        productName: order.product?.name,
        price: order.product?.price,   // ✅ include price
        status: order.status,
        address: order.address,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

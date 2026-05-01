import mongoose from "mongoose";

import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Deal from "../models/Deal.js";

export async function getStats(_req, res) {
  try {
    const [users, products, orders, deals] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Deal.countDocuments()
    ]);
    return res.status(200).json({ users, products, orders, deals });
  } catch (err) {
    console.error("getStats error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

function parsePaging(req) {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? "50", 10), 1), 200);
  const skip = Math.max(Number.parseInt(req.query.skip ?? "0", 10), 0);
  return { limit, skip };
}

export async function listUsers(req, res) {
  try {
    const { limit, skip } = parsePaging(req);
    const [items, total] = await Promise.all([
      User.find().select("-passwordHash").sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments()
    ]);
    return res.status(200).json({ items, total, limit, skip });
  } catch (err) {
    console.error("listUsers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function setUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body ?? {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!["admin", "vendor", "customer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (err) {
    console.error("setUserRole error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listProducts(req, res) {
  try {
    const { limit, skip } = parsePaging(req);
    const [items, total] = await Promise.all([
      Product.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("vendorId", "name email role"),
      Product.countDocuments()
    ]);
    return res.status(200).json({ items, total, limit, skip });
  } catch (err) {
    console.error("listProducts error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deleteProductById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Product not found" });
    }
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("deleteProductById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listOrders(req, res) {
  try {
    const { limit, skip } = parsePaging(req);
    const [items, total] = await Promise.all([
      Order.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("productId")
        .populate("dealId"),
      Order.countDocuments()
    ]);
    return res.status(200).json({ items, total, limit, skip });
  } catch (err) {
    console.error("listOrders error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body ?? {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (!["pending", "shipped", "delivered"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true })
      .populate("productId")
      .populate("dealId");
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.status(200).json(order);
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listDeals(req, res) {
  try {
    const { limit, skip } = parsePaging(req);
    const [items, total] = await Promise.all([
      Deal.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate("productId"),
      Deal.countDocuments()
    ]);
    return res.status(200).json({ items, total, limit, skip });
  } catch (err) {
    console.error("listDeals error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}


import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";
import Deal from "../models/Deal.js";
import requireAuth from "../middleware/requireAuth.js";
import { createOrder } from "../controllers/orderController.js";

const router = express.Router();

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay is not configured. Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET.");
  }
  return new Razorpay({ key_id, key_secret });
}

const useMockPayment = !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET;

router.post("/create-order", requireAuth, async (req, res) => {
  try {
    const { dealId, currency = "INR" } = req.body ?? {};
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return res.status(400).json({ message: "Valid dealId is required" });
    }

    const deal = await Deal.findById(dealId).populate("productId");
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    if (deal.status !== "completed") {
      return res.status(400).json({ message: "Deal is not completed" });
    }

    const amount = Number(deal.discountPrice > 0 ? deal.discountPrice : deal.productId?.price ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: `receipt_${dealId}_${Date.now()}`,
    };

    if (useMockPayment) {
      return res.json({
        mock: true,
        dealId,
        amount,
        currency,
        message: "Razorpay is not configured, using mock payment."
      });
    }

    const razorpay = getRazorpayInstance();
    try {
      const order = await razorpay.orders.create(options);
      return res.json({ ...order, key_id: process.env.RAZORPAY_KEY_ID, dealId, amount, currency });
    } catch (error) {
      console.error("create-order gateway error:", error);
      return res.json({
        mock: true,
        dealId,
        amount,
        currency,
        message: "Payment gateway unavailable, using mock payment."
      });
    }
  } catch (error) {
    console.error("create-order error:", error);
    return res.status(500).json({ message: error.message });
  }
});

router.post("/verify-payment", requireAuth, async (req, res) => {
  try {
    const {
      mock,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      dealId,
      address,
    } = req.body ?? {};

    if (mock) {
      if (!dealId || !address || typeof address !== "string" || !address.trim()) {
        return res.status(400).json({ message: "dealId and address are required" });
      }

      req.body = { dealId, address: address.trim() };
      return createOrder(req, res);
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Payment details are required" });
    }

    if (!dealId || !address || typeof address !== "string" || !address.trim()) {
      return res.status(400).json({ message: "dealId and address are required" });
    }

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ status: "failure", message: "Invalid payment signature" });
    }

    req.body = { dealId, address: address.trim() };
    return createOrder(req, res);
  } catch (error) {
    console.error("verify-payment error:", error);
    return res.status(500).json({ message: error.message });
  }
});

export default router;
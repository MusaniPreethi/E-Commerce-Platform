import mongoose from "mongoose";
import Deal from "../models/Deal.js";
import Product from "../models/Product.js";

function isExpired(deal) {
  return deal?.expiresAt instanceof Date && deal.expiresAt.getTime() <= Date.now();
}

export async function createDeal(req, res) {
  try {
    const { productId, requiredUsers } = req.body ?? {};

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Valid productId is required" });
    }

    const requiredUsersNum = Number(requiredUsers);
    if (!Number.isFinite(requiredUsersNum) || requiredUsersNum < 1) {
      return res.status(400).json({ message: "requiredUsers must be >= 1" });
    }

    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const deal = await Deal.create({
      productId,
      requiredUsers: requiredUsersNum,
      status: "open",
      joinedUsers: [],
      creatorId: req.user?._id ? String(req.user._id) : "anonymous"
    });

    return res.status(201).json(deal);
  } catch (err) {
    console.error("createDeal error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function joinDeal(req, res) {
  try {
    const { dealId } = req.params;
    const userId = req.user?._id ? String(req.user._id) : null;

    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return res.status(400).json({ message: "Valid dealId is required" });
    }
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const existing = await Deal.findById(dealId);
    if (!existing) {
      return res.status(404).json({ message: "Deal not found" });
    }

    if (existing.status !== "open") {
      return res.status(400).json({ message: `Deal is ${existing.status}` });
    }

    if (isExpired(existing)) {
      await Deal.findByIdAndUpdate(dealId, { status: "expired" }, { new: false });
      return res.status(400).json({ message: "Deal is expired" });
    }

    const updated = await Deal.findByIdAndUpdate(
      dealId,
      { $addToSet: { joinedUsers: userId } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Deal not found" });
    }

    const isDuplicateJoin = existing.joinedUsers.includes(userId);
    if (isDuplicateJoin) {
      return res.status(200).json(updated);
    }

    if (updated.joinedUsers.length >= updated.requiredUsers && updated.status === "open") {
      const completed = await Deal.findByIdAndUpdate(
        dealId,
        { status: "completed" },
        { new: true }
      );
      return res.status(200).json(completed ?? updated);
    }

    return res.status(200).json(updated);
  } catch (err) {
    console.error("joinDeal error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getDealById(req, res) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Deal not found" });
    }

    const deal = await Deal.findById(id).populate("productId");
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    if (deal.status === "open" && isExpired(deal)) {
      deal.status = "expired";
      await deal.save();
    }

    return res.status(200).json(deal);
  } catch (err) {
    console.error("getDealById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}


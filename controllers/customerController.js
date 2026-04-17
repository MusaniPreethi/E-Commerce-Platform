import mongoose from "mongoose";
import Order from "../models/Order.js";
import Deal from "../models/Deal.js";

export async function getMyProfile(req, res) {
  return res.status(200).json(req.user);
}

export async function getMyOrders(req, res) {
  try {
    const orders = await Order.find({ userId: String(req.user._id) })
      .sort({ createdAt: -1 })
      .populate("productId")
      .populate("dealId");
    return res.status(200).json(orders);
  } catch (err) {
    console.error("getMyOrders error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getMyDeals(req, res) {
  try {
    const uid = String(req.user._id);
    const deals = await Deal.find({
      $or: [{ creatorId: uid }, { joinedUsers: uid }]
    })
      .sort({ createdAt: -1 })
      .populate("productId");
    return res.status(200).json(deals);
  } catch (err) {
    console.error("getMyDeals error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getWishlist(req, res) {
  try {
    const user = await req.user.populate({
      path: "wishlist",
      select: "name price category image description"
    });
    return res.status(200).json(user.wishlist ?? []);
  } catch (err) {
    console.error("getWishlist error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function addToWishlist(req, res) {
  try {
    const { productId } = req.params;
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Valid productId is required" });
    }

    const updated = await req.user.updateOne({ $addToSet: { wishlist: productId } });
    if (!updated) {
      return res.status(500).json({ message: "Could not update wishlist" });
    }

    const user = await req.user.populate({
      path: "wishlist",
      select: "name price category image description"
    });
    return res.status(200).json(user.wishlist ?? []);
  } catch (err) {
    console.error("addToWishlist error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function removeFromWishlist(req, res) {
  try {
    const { productId } = req.params;
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Valid productId is required" });
    }

    const updated = await req.user.updateOne({ $pull: { wishlist: productId } });
    if (!updated) {
      return res.status(500).json({ message: "Could not update wishlist" });
    }

    const user = await req.user.populate({
      path: "wishlist",
      select: "name price category image description"
    });
    return res.status(200).json(user.wishlist ?? []);
  } catch (err) {
    console.error("removeFromWishlist error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}


import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  getMyDeals,
  getMyOrders,
  getMyProfile,
  getWishlist,
  addToWishlist,
  removeFromWishlist
} from "../controllers/customerController.js";

const router = Router();

router.get("/me", requireAuth, getMyProfile);
router.get("/orders", requireAuth, getMyOrders);
router.get("/deals", requireAuth, getMyDeals);
router.get("/wishlist", requireAuth, getWishlist);
router.post("/wishlist/:productId", requireAuth, addToWishlist);
router.delete("/wishlist/:productId", requireAuth, removeFromWishlist);

export default router;


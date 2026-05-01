import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import {
  deleteProductById,
  getStats,
  listDeals,
  listOrders,
  listProducts,
  listUsers,
  setUserRole,
  updateOrderStatus
} from "../controllers/adminController.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/stats", getStats);
router.get("/users", listUsers);
router.patch("/users/:id/role", setUserRole);

router.get("/products", listProducts);
router.delete("/products/:id", deleteProductById);

router.get("/orders", listOrders);
router.patch("/orders/:id/status", updateOrderStatus);

router.get("/deals", listDeals);

export default router;


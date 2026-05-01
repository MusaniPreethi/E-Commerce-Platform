import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProductCategories,
  getMyProducts,
  getProducts,
  updateProduct
} from "../controllers/productController.js";
import requireAuth from "../middleware/requireAuth.js";
import { requireAnyRole } from "../middleware/requireRole.js";

const router = Router();

router.get("/categories", getProductCategories);
router.get("/mine", requireAuth, requireAnyRole(["admin", "vendor"]), getMyProducts);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", requireAuth, requireAnyRole(["admin", "vendor"]), createProduct);
router.put("/:id", requireAuth, requireAnyRole(["admin", "vendor"]), updateProduct);
router.delete("/:id", requireAuth, requireAnyRole(["admin", "vendor"]), deleteProduct);

export default router;


import { Router } from "express";
import {
  createDeal,
  getDealById,
  joinDeal
} from "../controllers/dealController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

router.post("/create", requireAuth, createDeal);
router.post("/join/:dealId", requireAuth, joinDeal);
router.get("/:id", getDealById);

export default router;


import { Router } from "express";
import { createAdmin, login, logout, me, register } from "../controllers/authController.js";
import requireAuth from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

// Admin-only: create other admins (bootstrap with first admin via env script later)
router.post("/admin/create", requireAuth, requireRole("admin"), createAdmin);

export default router;


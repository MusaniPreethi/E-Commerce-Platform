import bcrypt from "bcryptjs";

import User from "../models/User.js";
import { getAccessTokenCookieName, signAccessToken } from "../utils/jwt.js";

function cookieOptions(req) {
  const isProd = process.env.NODE_ENV === "production";
  const sameSite = isProd ? "none" : "lax";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite,
    path: "/"
  };
}

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body ?? {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "email is required" });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "password must be at least 6 chars" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: "Email already in use" });

    const safeRole = role === "vendor" || role === "customer" ? role : "customer";
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: typeof name === "string" ? name.trim() : "",
      email: normalizedEmail,
      passwordHash,
      role: safeRole
    });

    const token = signAccessToken(user);
    res.cookie(getAccessTokenCookieName(), token, cookieOptions(req));

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "email is required" });
    }
    if (!password || typeof password !== "string") {
      return res.status(400).json({ message: "password is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signAccessToken(user);
    res.cookie(getAccessTokenCookieName(), token, cookieOptions(req));

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function logout(req, res) {
  res.clearCookie(getAccessTokenCookieName(), { path: "/" });
  return res.status(200).json({ status: "ok" });
}

export async function me(req, res) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  return res.status(200).json(req.user);
}

export async function createAdmin(req, res) {
  try {
    const { name, email, password } = req.body ?? {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "email is required" });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "password must be at least 8 chars" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: typeof name === "string" ? name.trim() : "",
      email: normalizedEmail,
      passwordHash,
      role: "admin"
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    console.error("createAdmin error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}


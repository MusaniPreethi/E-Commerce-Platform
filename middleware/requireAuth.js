import User from "../models/User.js";
import { getAccessTokenCookieName, verifyAccessToken } from "../utils/jwt.js";

export default async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[getAccessTokenCookieName()];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = verifyAccessToken(token);
    const userId = payload?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("-passwordHash");
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = user;
    return next();
  } catch (_err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}


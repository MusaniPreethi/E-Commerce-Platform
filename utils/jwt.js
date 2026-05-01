import jwt from "jsonwebtoken";

const ACCESS_TOKEN_NAME = "accessToken";

export function signAccessToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");

  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
  return jwt.sign(
    { sub: String(user._id), role: user.role, email: user.email },
    secret,
    { expiresIn }
  );
}

export function verifyAccessToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  return jwt.verify(token, secret);
}

export function getAccessTokenCookieName() {
  return ACCESS_TOKEN_NAME;
}


import jwt from "jsonwebtoken";
import { failure } from "./api-response.js";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET environment variable");
  return secret;
}

export function signToken(payload) {
  const secret = getSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token) {
  const secret = getSecret();
  return jwt.verify(token, secret);
}

export function getTokenFromRequest(req) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (auth && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  // Also check cookie if present (fallback)
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  return null;
}

export function requireAuth(req) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return { error: failure("Authentication required", 401), user: null };
  }
  try {
    const decoded = verifyToken(token);
    // Expected payload: { id, email, role, name }
    if (!decoded.id || !decoded.email || !decoded.role) {
      return { error: failure("Invalid token payload", 401), user: null };
    }
    return { error: null, user: decoded };
  } catch (err) {
    const message = err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    return { error: failure(message, 401), user: null };
  }
}

export function requireRole(user, allowed) {
  if (!user) return false;
  return allowed.includes(user.role);
}

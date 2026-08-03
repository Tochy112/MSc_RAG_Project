import jwt from "jsonwebtoken";
import { UserModel } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "tochy_default_secret";

export async function ensureAuthenticated(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token required" });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await UserModel.findById(payload.userId).lean();
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = { id: user._id, username: user.username, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired authorization token" });
  }
}

export function ensureAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export function ensureAdminOrStaff(req, res, next) {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "staff")) {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
}

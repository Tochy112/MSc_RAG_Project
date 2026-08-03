import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "tochy_default_secret";
const JWT_EXPIRATION = "8h";
const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "password";

export async function ensureDefaultAdmin() {
  if (await UserModel.exists({ role: "admin" })) {
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  await UserModel.create({
    username: DEFAULT_ADMIN_USERNAME,
    passwordHash,
    role: "admin",
  });
  console.log(`[auth] default admin created -> ${DEFAULT_ADMIN_USERNAME}`);
}

export async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await UserModel.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const verified = await user.verifyPassword(password);
    if (!verified) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRATION,
    });

    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({ error: "Unable to login" });
  }
}

export async function signup(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    if (username.toLowerCase() === DEFAULT_ADMIN_USERNAME.toLowerCase()) {
      return res.status(403).json({ error: "Staff cannot register with admin username" });
    }

    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      username,
      passwordHash,
      role: "staff",
    });

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRATION,
    });

    res.status(201).json({ token, role: user.role, username: user.username });
  } catch (err) {
    console.error("[signup]", err);
    res.status(500).json({ error: "Unable to register user" });
  }
}

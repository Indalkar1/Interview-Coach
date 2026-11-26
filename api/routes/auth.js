import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import Session from "../models/Session.js";

const router = Router();

const credsSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });

router.post("/register", async (req, res) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password } = parsed.data;

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists)
    return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash });

  res
    .status(201)
    .json({
      token: signToken(user._id),
      user: { id: user._id, email: user.email },
    });
});

router.post("/login", async (req, res) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password } = parsed.data;

  const user = await User.findOne({ email: email.toLowerCase() });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  res.json({
    token: signToken(user._id),
    user: { id: user._id, email: user.email },
  });
});

// Quick way to confirm a token works
router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select("email createdAt");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// Permanently delete the account and all of its data
router.delete("/me", requireAuth, async (req, res) => {
  const parsed = z.object({ password: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Password is required" });

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Incorrect password" });

  await Session.deleteMany({ userId: user._id });
  await User.deleteOne({ _id: user._id });
  res.json({ ok: true });
});

export default router;

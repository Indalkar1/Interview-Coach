import rateLimit from "express-rate-limit";

const base = { standardHeaders: true, legacyHeaders: false };

const reply = (error) => (req, res) => res.status(429).json({ error });

// Login/register: per IP, slows down password guessing
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  handler: reply("Too many attempts. Please try again in a few minutes."),
});

// AI endpoints: per logged-in user (these run after requireAuth)
export const aiBurstLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: (req) => req.userId,
  handler: reply("You're going too fast. Wait a minute and try again."),
});

export const aiDailyLimiter = rateLimit({
  ...base,
  windowMs: 24 * 60 * 60 * 1000,
  limit: 150,
  keyGenerator: (req) => req.userId,
  handler: reply("Daily limit reached. Come back tomorrow."),
});

export const resumeLimiter = rateLimit({
  ...base,
  windowMs: 24 * 60 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => req.userId,
  handler: reply("Too many resume uploads today."),
});
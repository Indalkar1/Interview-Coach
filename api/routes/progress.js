import { Router } from "express";
import Session from "../models/Session.js";
import { requireAuth } from "../middleware/auth.js";
import { getWeakTopics } from "../services/progress.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const finished = { userId: req.userId, status: "finished" };

  const recent = await Session.find(finished)
    .sort({ createdAt: -1 })
    .limit(20)
    .select("overallScore role level createdAt");

  const trend = recent.reverse().map((s) => ({
    score: s.overallScore,
    role: s.role,
    level: s.level,
    date: s.createdAt,
  }));

  const scores = trend.map((t) => t.score);
  const total = await Session.countDocuments(finished);

  res.json({
    totalSessions: total,
    average: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null,
    best: scores.length ? Math.max(...scores) : null,
    trend,
    weakTopics: await getWeakTopics(req.userId),
    last: trend.length ? { role: trend[trend.length - 1].role, level: trend[trend.length - 1].level } : null,
  });
});

export default router;
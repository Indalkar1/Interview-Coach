import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import Session from "../models/Session.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { generateQuestion, evaluateAnswer } from "../services/interview.js";
import multer from "multer";
import OpenAI, { toFile } from "openai";

const router = Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(), // keep audio in memory, nothing is written to disk
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB is plenty for 3 minutes
});
const openai = new OpenAI(); // reads OPENAI_API_KEY

const MAX_QUESTIONS = 5;

const startSchema = z.object({
  role: z.string().min(2).max(80),
  level: z.enum(["junior", "mid", "senior"]),
  useResume: z.boolean().optional().default(false),
});
const answerSchema = z.object({ answer: z.string().max(4000) });

// Load a session that belongs to the logged-in user
async function loadSession(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid session id" });
    return null;
  }
  const session = await Session.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return null;
  }
  return session;
}

// Speech-to-text: audio in, text out
router.post("/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No audio uploaded" });

  const file = await toFile(req.file.buffer, "answer.m4a", {
    type: "audio/m4a",
  });
  const result = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "en",
    prompt:
      "Technical interview answer about software development: React, Redux, Node.js, API, MongoDB, useMemo.",
  });

  res.json({ text: result.text });
});

// 1. Start a session and get the first question
router.post("/", async (req, res) => {
  const parsed = startSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.issues[0].message });
  const { role, level, useResume } = parsed.data;

  let resumeSummary = null;
  if (useResume) {
    const user = await User.findById(req.userId).select("resume");
    resumeSummary = user?.resume?.summary || null;
  }

  const q = await generateQuestion({ role, level, resumeSummary });

  const session = await Session.create({
    userId: req.userId,
    role,
    level,
    useResume,
    turns: [{ question: q.question, topic: q.topic, difficulty: q.difficulty }],
  });

  res.status(201).json({
    sessionId: session._id,
    questionNumber: 1,
    totalQuestions: MAX_QUESTIONS,
    question: q.question,
    topic: q.topic,
    difficulty: q.difficulty,
  });
});

// 2. Submit an answer: get feedback and the next question
router.post("/:id/answer", async (req, res) => {
  const parsed = answerSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ error: "Answer is required (max 4000 characters)" });

  const session = await loadSession(req, res);
  if (!session) return;
  if (session.status !== "active")
    return res.status(400).json({ error: "Session already finished" });

  const turn = session.turns[session.turns.length - 1];
  if (turn.answerText !== undefined && turn.answerText !== null) {
    return res.status(400).json({ error: "Current question already answered" });
  }

  const answer = parsed.data.answer.trim();
  const evaluation = await evaluateAnswer({
    role: session.role,
    level: session.level,
    question: turn.question,
    answer,
  });

  turn.answerText = answer;
  turn.score = evaluation.score;
  turn.rubric = evaluation.rubric;
  turn.strengths = evaluation.strengths;
  turn.improvements = evaluation.improvements;
  turn.idealAnswer = evaluation.idealAnswer;

  const done = session.turns.length >= MAX_QUESTIONS;
  let next = null;

  if (!done) {
    const user = session.useResume
      ? await User.findById(req.userId).select("resume")
      : null;
    next = await generateQuestion({
      role: session.role,
      level: session.level,
      asked: session.turns.map((t) => t.question),
      resumeSummary: user?.resume?.summary || null,
    });
    session.turns.push({
      question: next.question,
      topic: next.topic,
      difficulty: next.difficulty,
    });
  }

  await session.save();

  res.json({
    evaluation,
    done,
    nextQuestion: next
      ? {
          questionNumber: session.turns.length,
          totalQuestions: MAX_QUESTIONS,
          question: next.question,
          topic: next.topic,
          difficulty: next.difficulty,
        }
      : null,
  });
});

// 3. Finish the session and compute the overall score
router.post("/:id/finish", async (req, res) => {
  const session = await loadSession(req, res);
  if (!session) return;

  const scored = session.turns.filter((t) => typeof t.score === "number");
  const overall = scored.length
    ? Math.round(
        (scored.reduce((sum, t) => sum + t.score, 0) / scored.length) * 10,
      ) / 10
    : 0;

  session.overallScore = overall;
  session.status = "finished";
  await session.save();

  const weakest = [...scored].sort((a, b) => a.score - b.score).slice(0, 2);

  res.json({
    overallScore: overall,
    answered: scored.length,
    weakestAnswers: weakest.map((t) => ({
      topic: t.topic,
      question: t.question,
      score: t.score,
    })),
  });
});

// 4. Fetch one session (for history screens later)
router.get("/:id", async (req, res) => {
  const session = await loadSession(req, res);
  if (!session) return;
  res.json(session);
});

export default router;

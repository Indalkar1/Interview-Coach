import "dotenv/config";
import dns from "node:dns";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import sessionRoutes from "./routes/sessions.js";
import resumeRoutes from "./routes/resume.js";
import progressRoutes from "./routes/progress.js";
import { authLimiter } from "./middleware/limits.js";

// Only needed on some home networks, not on a hosting provider
// your computer couldn’t do the DNS lookup for the mongodb+srv:// address  so use Google DNS in the Node app
if (process.env.NODE_ENV !== "production") dns.setServers(["8.8.8.8", "1.1.1.1"]);

for (const key of ["MONGODB_URI", "JWT_SECRET", "ANTHROPIC_API_KEY"]) {
  if (!process.env[key]) {
    console.error(`Missing ${key} in environment`);
    process.exit(1);
  }
}

const app = express();
app.set("trust proxy", 1); // so rate limits see real client IPs behind Render/Railway
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use("/auth", authLimiter, authRoutes);
app.use("/sessions", sessionRoutes);
app.use("/resume", resumeRoutes);
app.use("/progress", progressRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Request too large" });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON" });
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
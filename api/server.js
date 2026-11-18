import authRoutes from "./routes/auth.js";
import sessionRoutes from "./routes/sessions.js";
import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
// your computer couldn’t do the DNS lookup for the mongodb+srv:// address  so use Google DNS in the Node app
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/auth", authRoutes);
app.use("/sessions", sessionRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

app.get("/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
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

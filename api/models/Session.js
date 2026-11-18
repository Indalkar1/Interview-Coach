import mongoose from "mongoose";

const TurnSchema = new mongoose.Schema({
  question: String,
  topic: String,
  difficulty: String,
  answerText: String,
  score: Number,
  rubric: { accuracy: Number, depth: Number, clarity: Number },
  strengths: [String],
  improvements: [String],
  idealAnswer: String,
});

const SessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    role: String,
    level: String,
    useResume: { type: Boolean, default: false },
    turns: [TurnSchema],
    overallScore: Number,
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model("Session", SessionSchema);
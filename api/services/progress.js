import mongoose from "mongoose";
import Session from "../models/Session.js";

// Topics where the user averages below 7/10, with at least 2 answers
export async function getWeakTopics(userId, limit = 5) {
  return Session.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $unwind: "$turns" },
    { $match: { "turns.score": { $type: "number" }, "turns.topic": { $type: "string" } } },
    {
      $group: {
        _id: { $toLower: { $trim: { input: "$turns.topic" } } }, // merges "React" and "react"
        topic: { $first: "$turns.topic" },
        avgScore: { $avg: "$turns.score" },
        attempts: { $sum: 1 },
      },
    },
    { $match: { attempts: { $gte: 2 }, avgScore: { $lt: 7 } } },
    { $sort: { avgScore: 1 } },
    { $limit: limit },
    { $project: { _id: 0, topic: 1, attempts: 1, avgScore: { $round: ["$avgScore", 1] } } },
  ]);
}
import { model, models, Schema } from "mongoose";

const ListeningAttemptSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  missionId: { type: Schema.Types.ObjectId, ref: "Mission", required: true, index: true },
  attempts: { type: Number, default: 0 }, errors: { type: Number, default: 0 },
  completedSegments: { type: Number, default: 0 }, elapsedSeconds: { type: Number, default: 0 },
  score: { type: Number, default: 0 }, accuracy: { type: Number, default: 0 },
  masteryPercent: { type: Number, default: 0, min: 0, max: 100 },
  status: { type: String, enum: ["in_progress", "completed", "abandoned"], default: "in_progress" },
}, { timestamps: true });

export const ListeningAttempt = models.ListeningAttempt ?? model("ListeningAttempt", ListeningAttemptSchema);

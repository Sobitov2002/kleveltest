import { model, models, Schema } from "mongoose";

const UserSchema = new Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 60 },
  lastName: { type: String, required: true, trim: true, maxlength: 60 },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  avatar: { type: String },
  totalScore: { type: Number, default: 0, min: 0 },
  totalAttempts: { type: Number, default: 0, min: 0 },
  totalErrors: { type: Number, default: 0, min: 0 },
  completedMissions: { type: Number, default: 0, min: 0 },
  currentLevel: { type: Number, default: 1, min: 1 },
  status: { type: String, enum: ["active", "suspended"], default: "active", index: true },
  profileStatus: { type: String, default: "", trim: true, maxlength: 100 },
  rewardStickers: { type: [{ id: String, emoji: String, label: String, message: String, awardedAt: { type: Date, default: Date.now } }], default: [] },
}, { timestamps: true });

export const User = models.User ?? model("User", UserSchema);

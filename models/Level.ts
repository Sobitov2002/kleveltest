import { model, models, Schema } from "mongoose";

const LevelSchema = new Schema({
  number: { type: Number, required: true, unique: true, min: 1 },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  order: { type: Number, required: true },
  published: { type: Boolean, default: true },
}, { timestamps: true });

export const Level = models.Level ?? model("Level", LevelSchema);

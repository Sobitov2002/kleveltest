import { model, models, Schema } from "mongoose";

const SegmentSchema = new Schema({
  order: { type: Number, required: true }, startTime: { type: Number, required: true },
  endTime: { type: Number, required: true }, text: { type: String, required: true },
  points: { type: Number, required: true, min: 0 },
}, { _id: true });

const MissionSchema = new Schema({
  title: { type: String, required: true, trim: true }, description: { type: String, default: "" },
  level: { type: Number, required: true, index: true }, difficulty: { type: String, enum: ["Oson", "O‘rta", "Qiyin"], default: "Oson" },
  thumbnail: { type: String, default: "" },
  video: { provider: { type: String, enum: ["cloudinary", "external"], default: "cloudinary" }, publicId: String, url: { type: String, default: "" }, thumbnailUrl: String, duration: { type: Number, default: 0 } },
  totalPoints: { type: Number, default: 0 }, segments: { type: [SegmentSchema], default: [] },
  fullTranscript: { type: String, required: true, trim: true, minlength: 1 },
  order: { type: Number, required: true }, published: { type: Boolean, default: false },
}, { timestamps: true });

MissionSchema.index({ level: 1, order: 1 });
export const Mission = models.Mission ?? model("Mission", MissionSchema);

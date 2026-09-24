import { model, models, Schema } from "mongoose";

const MissionMessageSchema = new Schema({
  missionId: { type: Schema.Types.ObjectId, required: true, ref: "Mission", index: true },
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
  text: { type: String, required: true, trim: true, maxlength: 1000 },
}, { timestamps: true });

MissionMessageSchema.index({ missionId: 1, createdAt: -1 });
export const MissionMessage = models.MissionMessage ?? model("MissionMessage", MissionMessageSchema);

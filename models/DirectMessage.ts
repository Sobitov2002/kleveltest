import { model, models, Schema } from "mongoose";

const DirectMessageSchema = new Schema({
  fromUserId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
  toUserId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true });

DirectMessageSchema.index({ fromUserId: 1, toUserId: 1, createdAt: 1 });
DirectMessageSchema.index({ toUserId: 1, fromUserId: 1, createdAt: 1 });

export const DirectMessage = models.DirectMessage ?? model("DirectMessage", DirectMessageSchema);

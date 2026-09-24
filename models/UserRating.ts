import { model, models, Schema } from "mongoose";

const UserRatingSchema = new Schema({
  fromUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  toUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  stars: { type: Number, required: true, min: 1, max: 5 },
}, { timestamps: true });

UserRatingSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });
export const UserRating = models.UserRating ?? model("UserRating", UserRatingSchema);

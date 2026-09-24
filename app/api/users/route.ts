import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { UserRating } from "@/models/UserRating";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  try {
    await connectToDatabase();
    const users = await User.find({ status: { $ne: "suspended" } }).sort({ totalScore: -1, createdAt: 1 }).limit(200).select("firstName lastName profileStatus totalScore completedMissions currentLevel rewardStickers").lean();
    const aggregates = await UserRating.aggregate<{ _id: unknown; average: number; count: number }>([
      { $group: { _id: "$toUserId", average: { $avg: "$stars" }, count: { $sum: 1 } } },
    ]);
    const fromUserId = await getSessionUserId();
    const myRatings = fromUserId ? await UserRating.find({ fromUserId }).select("toUserId stars").lean() : [];
    const ratings = new Map(aggregates.map((rating) => [String(rating._id), { average: Math.round(rating.average * 10) / 10, count: rating.count }]));
    const myStars = new Map(myRatings.map((rating) => [String(rating.toUserId), rating.stars]));
    return NextResponse.json({ ownUserId: fromUserId, users: users.map((user) => ({ id: String(user._id), name: `${user.firstName} ${user.lastName}`, profileStatus: user.profileStatus ?? "", totalScore: user.totalScore, completedMissions: user.completedMissions, currentLevel: user.currentLevel, rewardStickers: user.rewardStickers ?? [], myStars: myStars.get(String(user._id)) ?? 0, ...(ratings.get(String(user._id)) ?? { average: 0, count: 0 }) })) });
  } catch { return NextResponse.json({ error: "Foydalanuvchilarni yuklab bo‘lmadi." }, { status: 503 }); }
}

import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET(_request: Request, context: RouteContext<"/api/users/[id]">) {
  const { id } = await context.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Profil topilmadi." }, { status: 404 });
  try {
    await connectToDatabase();
    const user = await User.findOne({ _id: id, status: { $ne: "suspended" } }).select("firstName lastName profileStatus totalScore completedMissions currentLevel rewardStickers").lean();
    if (!user) return NextResponse.json({ error: "Profil topilmadi." }, { status: 404 });
    return NextResponse.json({ user: { id: String(user._id), firstName: user.firstName, lastName: user.lastName, profileStatus: user.profileStatus ?? "", totalScore: user.totalScore, completedMissions: user.completedMissions, currentLevel: user.currentLevel, rewardStickers: user.rewardStickers ?? [] } });
  } catch { return NextResponse.json({ error: "Profilni yuklab bo‘lmadi." }, { status: 503 }); }
}

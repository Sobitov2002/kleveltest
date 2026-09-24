import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET() {
  try {
    await connectToDatabase();
    const users = await User.find({ status: { $ne: "suspended" } }).sort({ totalScore: -1, completedMissions: -1, totalErrors: 1, createdAt: 1 }).limit(5).select("firstName lastName totalScore completedMissions currentLevel").lean();
    return NextResponse.json({ users: users.map((user, index) => ({ rank: index + 1, name: `${user.firstName} ${user.lastName}`, totalScore: user.totalScore, completedMissions: user.completedMissions, currentLevel: user.currentLevel })) });
  } catch { return NextResponse.json({ error: "Reytingni yuklab bo‘lmadi." }, { status: 503 }); }
}

import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getUserMastery } from "@/lib/listening/getUserMastery";
import { connectToDatabase } from "@/lib/mongodb";
import { Mission } from "@/models/Mission";
import { User } from "@/models/User";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId || !isValidObjectId(userId)) return NextResponse.json({ error: "Avval hisobga kiring." }, { status: 401 });
  try {
    await connectToDatabase();
    const user = await User.findOne({ _id: userId, status: { $ne: "suspended" } }).select("firstName lastName profileStatus totalScore totalAttempts totalErrors completedMissions currentLevel rewardStickers").lean();
    if (!user) return NextResponse.json({ error: "Profil topilmadi." }, { status: 404 });
    const mastery = await getUserMastery(userId);
    const missions = await Mission.find({ published: true }).sort({ level: 1, order: 1 }).select("title level order segments fullTranscript").lean();
    return NextResponse.json({ user, missions: missions.map((mission) => {
      const id = String(mission._id);
      const masteryPercent = mastery.get(id) ?? 0;
      return { id, title: mission.title, level: mission.level, order: mission.order, masteryPercent, completed: masteryPercent >= 90, ...(masteryPercent >= 90 && mission.fullTranscript ? { fullTranscript: mission.fullTranscript } : {}) };
    }) });
  } catch { return NextResponse.json({ error: "Profil ma’lumotlarini yuklab bo‘lmadi." }, { status: 503 }); }
}

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId || !isValidObjectId(userId)) return NextResponse.json({ error: "Avval hisobga kiring." }, { status: 401 });
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || typeof (body as Record<string, unknown>).profileStatus !== "string") return NextResponse.json({ error: "Status matnini kiriting." }, { status: 400 });
    const profileStatus = (body as { profileStatus: string }).profileStatus.trim();
    if (profileStatus.length > 100) return NextResponse.json({ error: "Status 100 ta belgidan oshmasin." }, { status: 400 });
    await connectToDatabase();
    const user = await User.findOneAndUpdate({ _id: userId, status: { $ne: "suspended" } }, { $set: { profileStatus } }, { returnDocument: "after" }).select("profileStatus").lean();
    if (!user) return NextResponse.json({ error: "Profil topilmadi." }, { status: 404 });
    return NextResponse.json({ profileStatus: user.profileStatus });
  } catch { return NextResponse.json({ error: "Statusni saqlab bo‘lmadi." }, { status: 503 }); }
}

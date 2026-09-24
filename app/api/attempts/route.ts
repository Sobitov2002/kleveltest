import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { calculateScore } from "@/lib/listening/calculateScore";
import { connectToDatabase } from "@/lib/mongodb";
import { ListeningAttempt } from "@/models/ListeningAttempt";
import { Mission } from "@/models/Mission";
import { User } from "@/models/User";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId || !isValidObjectId(userId)) return NextResponse.json({ error: "Davom etish uchun avval kiring." }, { status: 401 });
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Natija ma’lumotlari noto‘g‘ri." }, { status: 400 });
    const input = body as Record<string, unknown>;
    if (typeof input.missionId !== "string" || !isValidObjectId(input.missionId) || !Number.isInteger(input.attempts) || !Number.isInteger(input.errors) || !Number.isInteger(input.completedSegments) || !Number.isInteger(input.elapsedSeconds)) return NextResponse.json({ error: "Natija ma’lumotlari noto‘g‘ri." }, { status: 400 });
    await connectToDatabase();
    const activeUser = await User.findOne({ _id: userId, status: { $ne: "suspended" } }).select("_id").lean();
    if (!activeUser) return NextResponse.json({ error: "Hisobingiz vaqtincha to‘xtatilgan." }, { status: 403 });
    const mission = await Mission.findOne({ _id: input.missionId, published: true }).select("level segments").lean();
    const completedSegments = Number(input.completedSegments);
    if (!mission || mission.segments.length === 0 || completedSegments < 0 || completedSegments > mission.segments.length) return NextResponse.json({ error: "Mashq natijasini saqlab bo‘lmadi." }, { status: 400 });
    const masteryPercent = Math.floor((completedSegments / mission.segments.length) * 100);
    const attempts = Math.max(completedSegments, Math.min(10000, Number(input.attempts)));
    const errors = Math.max(0, Math.min(attempts - completedSegments, Number(input.errors)));
    const basePoints = mission.segments.slice(0, completedSegments).reduce((total: number, segment: { points: number }) => total + segment.points, 0);
    const score = calculateScore(basePoints, errors);
    const elapsedSeconds = Math.max(0, Math.min(86400, Number(input.elapsedSeconds)));
    const attempt = await ListeningAttempt.create({ userId, missionId: mission._id, attempts, errors, completedSegments, elapsedSeconds, score, accuracy: attempts ? Math.round(((attempts - errors) / attempts) * 100) : 0, masteryPercent, status: "completed" });
    const update: { $inc: Record<string, number>; $max?: { currentLevel: number } } = { $inc: { totalScore: score, totalAttempts: attempts, totalErrors: errors } };
    if (masteryPercent >= 90) {
      const alreadyMastered = await ListeningAttempt.exists({ userId, missionId: mission._id, status: "completed", masteryPercent: { $gte: 90 }, _id: { $ne: attempt._id } });
      if (!alreadyMastered) update.$inc.completedMissions = 1;
      update.$max = { currentLevel: Math.min(4, mission.level + 1) };
    }
    await User.updateOne({ _id: userId }, update);
    return NextResponse.json({ attempt: { score, accuracy: attempt.accuracy, masteryPercent } }, { status: 201 });
  } catch { return NextResponse.json({ error: "Natijani saqlab bo‘lmadi." }, { status: 503 }); }
}

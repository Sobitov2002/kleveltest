import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { ListeningAttempt } from "@/models/ListeningAttempt";
import { MissionMessage } from "@/models/MissionMessage";

export async function GET() {
  if (!await isAdminSession()) return NextResponse.json({ error: "Admin ruxsati kerak." }, { status: 403 });
  try {
    await connectToDatabase();
    const [attempts, discussions] = await Promise.all([
      ListeningAttempt.find({ status: "completed" }).sort({ createdAt: -1 }).limit(60).populate("userId", "firstName lastName").populate("missionId", "title level order").lean(),
      MissionMessage.find().sort({ createdAt: -1 }).limit(100).populate("userId", "firstName lastName").populate("missionId", "title level order").lean(),
    ]);
    return NextResponse.json({
      attempts: attempts.flatMap((attempt) => {
        const user = attempt.userId as unknown as { firstName: string; lastName: string } | null;
        const mission = attempt.missionId as unknown as { title: string; level: number; order: number } | null;
        return user && mission ? [{ id: String(attempt._id), userName: `${user.firstName} ${user.lastName}`, missionTitle: mission.title, level: mission.level, order: mission.order, masteryPercent: attempt.masteryPercent ?? 0, score: attempt.score, createdAt: attempt.createdAt }] : [];
      }),
      discussions: discussions.flatMap((message) => {
        const user = message.userId as unknown as { firstName: string; lastName: string } | null;
        const mission = message.missionId as unknown as { title: string; level: number; order: number } | null;
        return user && mission ? [{ id: String(message._id), userName: `${user.firstName} ${user.lastName}`, missionTitle: mission.title, level: mission.level, order: mission.order, text: message.text, createdAt: message.createdAt }] : [];
      }),
    });
  } catch { return NextResponse.json({ error: "Faoliyatlarni yuklab bo‘lmadi." }, { status: 503 }); }
}

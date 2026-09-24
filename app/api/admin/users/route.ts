import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET() {
  if (!await isAdminSession()) return NextResponse.json({ error: "Admin ruxsati kerak." }, { status: 403 });
  try {
    await connectToDatabase();
    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(200).select("firstName lastName fullName email profileStatus totalScore totalAttempts totalErrors completedMissions currentLevel status createdAt").lean(),
      User.countDocuments(),
    ]);
    return NextResponse.json({ users: users.map((user) => ({ ...user, status: user.status ?? "active" })), total, limit: 200 });
  } catch { return NextResponse.json({ error: "Foydalanuvchilarni yuklab bo‘lmadi." }, { status: 503 }); }
}

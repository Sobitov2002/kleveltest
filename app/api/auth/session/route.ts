import { NextResponse } from "next/server";
import { clearSession, getSessionUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { isAdminEmail } from "@/lib/admin";

export async function GET() {
  try {
    const id = await getSessionUserId();
    if (!id) return NextResponse.json({ user: null });
    await connectToDatabase();
    const user = await User.findById(id).select("firstName lastName email totalScore completedMissions currentLevel status rewardStickers").lean();
    if (!user) return NextResponse.json({ user: null });
    if (user.status === "suspended") { await clearSession(); return NextResponse.json({ user: null }); }
    const { email, ...publicUser } = user;
    return NextResponse.json({ user: { ...publicUser, isAdmin: isAdminEmail(email) } });
  } catch { return NextResponse.json({ error: "Ma’lumotlarni yuklab bo‘lmadi." }, { status: 503 }); }
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getUserMastery } from "@/lib/listening/getUserMastery";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Avval hisobga kiring." }, { status: 401 });
  try {
    await connectToDatabase();
    const mastery = await getUserMastery(userId);
    return NextResponse.json({ mastery: Object.fromEntries(mastery), masteredMissionIds: [...mastery].filter(([, percent]) => percent >= 90).map(([id]) => id) });
  } catch { return NextResponse.json({ error: "Natijalarni yuklab bo‘lmadi." }, { status: 503 }); }
}

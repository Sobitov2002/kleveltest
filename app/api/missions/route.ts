import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Mission } from "@/models/Mission";

export async function GET() {
  try {
    await connectToDatabase();
    const missions = await Mission.find({ published: true }).select("-fullTranscript").sort({ level: 1, order: 1 }).lean();
    return NextResponse.json({ missions });
  } catch { return NextResponse.json({ error: "Mashqlarni yuklab bo‘lmadi." }, { status: 503 }); }
}

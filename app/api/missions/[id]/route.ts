import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Mission } from "@/models/Mission";

export async function GET(_request: Request, context: RouteContext<"/api/missions/[id]">) {
  const { id } = await context.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Mashq topilmadi." }, { status: 404 });
  try {
    await connectToDatabase();
    const mission = await Mission.findOne({ _id: id, published: true }).select("-fullTranscript").lean();
    if (!mission) return NextResponse.json({ error: "Mashq topilmadi." }, { status: 404 });
    return NextResponse.json({ mission });
  } catch { return NextResponse.json({ error: "Mashqni yuklab bo‘lmadi." }, { status: 503 }); }
}

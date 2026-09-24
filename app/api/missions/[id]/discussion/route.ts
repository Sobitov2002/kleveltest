import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Mission } from "@/models/Mission";
import { MissionMessage } from "@/models/MissionMessage";
import { User } from "@/models/User";

export async function GET(_request: Request, context: RouteContext<"/api/missions/[id]/discussion">) {
  const { id } = await context.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Mashq topilmadi." }, { status: 404 });
  try {
    await connectToDatabase();
    const mission = await Mission.exists({ _id: id, published: true });
    if (!mission) return NextResponse.json({ error: "Mashq topilmadi." }, { status: 404 });
    const messages = await MissionMessage.find({ missionId: id }).sort({ createdAt: -1 }).limit(100).populate("userId", "firstName lastName").lean();
    return NextResponse.json({ messages: messages.reverse().flatMap((message) => { const author = message.userId as unknown as { _id: unknown; firstName: string; lastName: string } | null; return author ? [{ id: String(message._id), userId: String(author._id), name: `${author.firstName} ${author.lastName}`, text: message.text, createdAt: message.createdAt }] : []; }) });
  } catch { return NextResponse.json({ error: "Muhokama xabarlarini yuklab bo‘lmadi." }, { status: 503 }); }
}

export async function POST(request: Request, context: RouteContext<"/api/missions/[id]/discussion">) {
  const userId = await getSessionUserId();
  if (!userId || !isValidObjectId(userId)) return NextResponse.json({ error: "Xabar yozish uchun hisobga kiring." }, { status: 401 });
  const { id } = await context.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Mashq topilmadi." }, { status: 404 });
  try {
    const body: unknown = await request.json();
    const text = body && typeof body === "object" && typeof (body as Record<string, unknown>).text === "string" ? ((body as Record<string, string>).text).trim() : "";
    if (!text || text.length > 1000) return NextResponse.json({ error: "Xabar 1–1000 belgi bo‘lishi kerak." }, { status: 400 });
    await connectToDatabase();
    const [mission, user] = await Promise.all([Mission.exists({ _id: id, published: true }), User.exists({ _id: userId, status: { $ne: "suspended" } })]);
    if (!mission || !user) return NextResponse.json({ error: "Faol mashq yoki foydalanuvchi topilmadi." }, { status: 404 });
    const message = await MissionMessage.create({ missionId: id, userId, text });
    const author = await User.findById(userId).select("firstName lastName").lean();
    return NextResponse.json({ message: { id: String(message._id), userId, name: `${author?.firstName ?? ""} ${author?.lastName ?? ""}`.trim(), text: message.text, createdAt: message.createdAt } }, { status: 201 });
  } catch { return NextResponse.json({ error: "Xabar yuborilmadi." }, { status: 503 }); }
}

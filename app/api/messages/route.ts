import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { DirectMessage } from "@/models/DirectMessage";
import { User } from "@/models/User";

export async function GET(request: Request) {
  const ownId = await getSessionUserId();
  if (!ownId || !isValidObjectId(ownId)) return NextResponse.json({ error: "Xabarlarni ko‘rish uchun hisobga kiring." }, { status: 401 });
  const targetId = new URL(request.url).searchParams.get("userId") ?? "";
  if (!isValidObjectId(targetId) || targetId === ownId) return NextResponse.json({ error: "Suhbatdosh topilmadi." }, { status: 400 });
  try {
    await connectToDatabase();
    const active = await User.countDocuments({ _id: { $in: [ownId, targetId] }, status: { $ne: "suspended" } });
    if (active !== 2) return NextResponse.json({ error: "Faol foydalanuvchi topilmadi." }, { status: 404 });
    const messages = await DirectMessage.find({ $or: [{ fromUserId: ownId, toUserId: targetId }, { fromUserId: targetId, toUserId: ownId }] }).sort({ createdAt: 1 }).limit(300).lean();
    return NextResponse.json({ messages: messages.map((message) => ({ id: String(message._id), fromUserId: String(message.fromUserId), text: message.text, createdAt: message.createdAt })) });
  } catch { return NextResponse.json({ error: "Xabarlarni yuklab bo‘lmadi." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const ownId = await getSessionUserId();
  if (!ownId || !isValidObjectId(ownId)) return NextResponse.json({ error: "Xabar yuborish uchun hisobga kiring." }, { status: 401 });
  try {
    const input: unknown = await request.json();
    const data = input && typeof input === "object" ? input as Record<string, unknown> : {};
    const targetId = String(data.userId ?? "");
    const text = typeof data.text === "string" ? data.text.trim() : "";
    if (!isValidObjectId(targetId) || targetId === ownId) return NextResponse.json({ error: "Suhbatdosh tanlanmadi." }, { status: 400 });
    if (!text || text.length > 2000) return NextResponse.json({ error: "Xabar 1–2000 belgi bo‘lishi kerak." }, { status: 400 });
    await connectToDatabase();
    const active = await User.countDocuments({ _id: { $in: [ownId, targetId] }, status: { $ne: "suspended" } });
    if (active !== 2) return NextResponse.json({ error: "Faol foydalanuvchi topilmadi." }, { status: 404 });
    const message = await DirectMessage.create({ fromUserId: ownId, toUserId: targetId, text });
    return NextResponse.json({ message: { id: String(message._id), fromUserId: ownId, text: message.text, createdAt: message.createdAt } }, { status: 201 });
  } catch { return NextResponse.json({ error: "Xabarni yuborib bo‘lmadi." }, { status: 503 }); }
}

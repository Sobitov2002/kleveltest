import { isValidObjectId, Types } from "mongoose";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { DirectMessage } from "@/models/DirectMessage";
import { User } from "@/models/User";
import { UserRating } from "@/models/UserRating";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId || !isValidObjectId(userId)) return NextResponse.json({ error: "Bildirishnomalar uchun hisobga kiring." }, { status: 401 });
  try {
    await connectToDatabase();
    const self = await User.findOne({ _id: userId, status: { $ne: "suspended" } }).select("_id").lean();
    if (!self) return NextResponse.json({ error: "Hisobingiz faol emas." }, { status: 403 });
    const ownObjectId = Types.ObjectId.createFromHexString(userId);
    const [messages, ratings] = await Promise.all([
      DirectMessage.find({ toUserId: ownObjectId }).sort({ createdAt: -1 }).limit(20).populate("fromUserId", "firstName lastName").lean(),
      UserRating.find({ toUserId: ownObjectId }).sort({ updatedAt: -1 }).limit(20).populate("fromUserId", "firstName lastName").lean(),
    ]);
    const items = [
      ...messages.map((message) => { const actor = message.fromUserId as unknown as { _id: Types.ObjectId; firstName: string; lastName: string } | null; return actor ? { id: `message:${String(message._id)}`, kind: "message" as const, actorId: String(actor._id), actor: `${actor.firstName} ${actor.lastName}`, text: message.text, createdAt: message.createdAt } : null; }),
      ...ratings.map((rating) => { const actor = rating.fromUserId as unknown as { _id: Types.ObjectId; firstName: string; lastName: string } | null; return actor ? { id: `rating:${String(rating._id)}:${new Date(rating.updatedAt).getTime()}`, kind: "rating" as const, actorId: String(actor._id), actor: `${actor.firstName} ${actor.lastName}`, text: `${rating.stars} yulduz bilan baholadi`, createdAt: rating.updatedAt } : null; }),
    ].filter((item): item is NonNullable<typeof item> => item !== null).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);
    return NextResponse.json({ items });
  } catch { return NextResponse.json({ error: "Bildirishnomalarni yuklab bo‘lmadi." }, { status: 503 }); }
}

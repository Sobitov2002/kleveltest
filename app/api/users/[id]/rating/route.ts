import { isValidObjectId, Types } from "mongoose";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { UserRating } from "@/models/UserRating";

export async function POST(request: Request, context: RouteContext<"/api/users/[id]/rating">) {
  const fromUserId = await getSessionUserId();
  if (!fromUserId || !isValidObjectId(fromUserId)) return NextResponse.json({ error: "Yulduz berish uchun hisobga kiring." }, { status: 401 });
  const { id: toUserId } = await context.params;
  if (!isValidObjectId(toUserId)) return NextResponse.json({ error: "Foydalanuvchi topilmadi." }, { status: 404 });
  if (fromUserId === toUserId) return NextResponse.json({ error: "O‘zingizga yulduz bera olmaysiz." }, { status: 400 });
  try {
    const input: unknown = await request.json();
    const stars = input && typeof input === "object" ? Number((input as Record<string, unknown>).stars) : 0;
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) return NextResponse.json({ error: "1 dan 5 gacha yulduz tanlang." }, { status: 400 });
    await connectToDatabase();
    const [fromUser, toUser] = await Promise.all([
      User.findOne({ _id: fromUserId, status: { $ne: "suspended" } }).select("_id").lean(),
      User.findOne({ _id: toUserId, status: { $ne: "suspended" } }).select("_id").lean(),
    ]);
    if (!fromUser) return NextResponse.json({ error: "Hisobingiz faol emas." }, { status: 403 });
    if (!toUser) return NextResponse.json({ error: "Foydalanuvchi topilmadi." }, { status: 404 });
    await UserRating.findOneAndUpdate({ fromUserId, toUserId }, { $set: { stars } }, { upsert: true, returnDocument: "after", runValidators: true });
    const [summary] = await UserRating.aggregate<{ average: number; count: number }>([
      { $match: { toUserId: Types.ObjectId.createFromHexString(toUserId) } },
      { $group: { _id: null, average: { $avg: "$stars" }, count: { $sum: 1 } } },
    ]);
    return NextResponse.json({ average: summary ? Math.round(summary.average * 10) / 10 : 0, count: summary?.count ?? 0, myStars: stars });
  } catch { return NextResponse.json({ error: "Yulduzni saqlab bo‘lmadi." }, { status: 503 }); }
}

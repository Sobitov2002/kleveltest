import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { isAdminEmail, isAdminSession } from "@/lib/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { ListeningAttempt } from "@/models/ListeningAttempt";
import { rewardStickers, type RewardStickerId } from "@/lib/listening/rewards";

export async function PATCH(request: Request, context: RouteContext<"/api/admin/users/[id]">) {
  if (!await isAdminSession()) return NextResponse.json({ error: "Admin ruxsati kerak." }, { status: 403 });
  const { id } = await context.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Foydalanuvchi topilmadi." }, { status: 404 });
  try {
    const input: unknown = await request.json();
    if (!input || typeof input !== "object") return NextResponse.json({ error: "Qiymatlarni tekshiring." }, { status: 400 });
    const body = input as Record<string, unknown>;
    const update: Record<string, number | string> = {};
    let stickerUpdate: { id: string; emoji: string; label: string; message: string; awardedAt: Date } | null = null;
    if (body.status !== undefined) {
      if (body.status !== "active" && body.status !== "suspended") return NextResponse.json({ error: "Hisob holati noto‘g‘ri." }, { status: 400 });
      if (body.status === "suspended" && await getSessionUserId() === id) return NextResponse.json({ error: "O‘z admin hisobingizni to‘xtata olmaysiz." }, { status: 400 });
      update.status = body.status;
    }
    if (body.totalScore !== undefined) {
      const totalScore = Number(body.totalScore);
      if (!Number.isInteger(totalScore) || totalScore < 0 || totalScore > 1_000_000_000) return NextResponse.json({ error: "Ball 0 dan 1 000 000 000 gacha butun son bo‘lishi kerak." }, { status: 400 });
      update.totalScore = totalScore;
    }
    if (body.currentLevel !== undefined) {
      const currentLevel = Number(body.currentLevel);
      if (!Number.isInteger(currentLevel) || currentLevel < 1 || currentLevel > 4) return NextResponse.json({ error: "Bosqich 1 dan 4 gacha bo‘lishi kerak." }, { status: 400 });
      update.currentLevel = currentLevel;
    }
    if (body.sticker !== undefined) {
      if (typeof body.sticker !== "string" || !Object.hasOwn(rewardStickers, body.sticker)) return NextResponse.json({ error: "Rag‘bat stikeri tanlanmadi." }, { status: 400 });
      const sticker = rewardStickers[body.sticker as RewardStickerId];
      stickerUpdate = { id: body.sticker, ...sticker, awardedAt: new Date() };
    }
    if (!Object.keys(update).length && !stickerUpdate) return NextResponse.json({ error: "O‘zgartiriladigan qiymat tanlanmadi." }, { status: 400 });
    await connectToDatabase();
    const operations = { ...(Object.keys(update).length ? { $set: update } : {}), ...(stickerUpdate ? { $push: { rewardStickers: stickerUpdate } } : {}) };
    const user = await User.findByIdAndUpdate(id, operations, { returnDocument: "after", runValidators: true }).select("firstName lastName email totalScore currentLevel status rewardStickers").lean();
    if (!user) return NextResponse.json({ error: "Foydalanuvchi topilmadi." }, { status: 404 });
    return NextResponse.json({ user: { ...user, status: user.status ?? "active" } });
  } catch { return NextResponse.json({ error: "Foydalanuvchini yangilab bo‘lmadi." }, { status: 503 }); }
}

export async function DELETE(_request: Request, context: RouteContext<"/api/admin/users/[id]">) {
  if (!await isAdminSession()) return NextResponse.json({ error: "Admin ruxsati kerak." }, { status: 403 });
  const { id } = await context.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Foydalanuvchi topilmadi." }, { status: 404 });
  if (await getSessionUserId() === id) return NextResponse.json({ error: "O‘z admin hisobingizni o‘chira olmaysiz." }, { status: 400 });
  try {
    await connectToDatabase();
    const user = await User.findById(id).select("email").lean();
    if (!user) return NextResponse.json({ error: "Foydalanuvchi topilmadi." }, { status: 404 });
    if (isAdminEmail(user.email)) return NextResponse.json({ error: "Admin hisobini bu yerdan o‘chirib bo‘lmaydi." }, { status: 400 });
    await ListeningAttempt.deleteMany({ userId: id });
    await User.deleteOne({ _id: id });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Foydalanuvchini o‘chirib bo‘lmadi." }, { status: 503 }); }
}

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { createSession } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Ma’lumotlarni tekshiring." }, { status: 400 });
    const { firstName, lastName, email } = body as Record<string, unknown>;
    if (typeof firstName !== "string" || typeof lastName !== "string" || typeof email !== "string" || !firstName.trim() || !lastName.trim() || !/^[^\s@]+@gmail\.com$/i.test(email.trim())) {
      return NextResponse.json({ error: "Ism, familiya va Gmail manzilini to‘g‘ri kiriting." }, { status: 400 });
    }
    await connectToDatabase();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFirstName = firstName.trim().normalize("NFKC").replace(/\s+/g, " ");
    const normalizedLastName = lastName.trim().normalize("NFKC").replace(/\s+/g, " ");
    const normalizeName = (value: string) => value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("uz");
    let user = await User.findOne({ email: normalizedEmail });
    if (user && (normalizeName(user.firstName) !== normalizeName(normalizedFirstName) || normalizeName(user.lastName) !== normalizeName(normalizedLastName))) {
      return NextResponse.json({ error: "Bu Gmail avval boshqa ism-familiya bilan bog‘langan. Hisob egasi sifatida avvalgi ma’lumotlaringiz bilan kiring." }, { status: 409 });
    }
    if (!user) {
      try { user = await User.create({ email: normalizedEmail, firstName: normalizedFirstName, lastName: normalizedLastName, fullName: `${normalizedFirstName} ${normalizedLastName}` }); }
      catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
        return NextResponse.json({ error: "Bu Gmail bilan hisob ochildi. Avval ro‘yxatdan o‘tgan ism-familiyangiz bilan kiring." }, { status: 409 });
      }
    }
    if (user.status === "suspended") return NextResponse.json({ error: "Hisobingiz vaqtincha to‘xtatilgan. Administrator bilan bog‘laning." }, { status: 403 });
    await createSession(user.id);
    return NextResponse.json({ user: { firstName: user.firstName, lastName: user.lastName, totalScore: user.totalScore, completedMissions: user.completedMissions, currentLevel: user.currentLevel, rewardStickers: user.rewardStickers, isAdmin: isAdminEmail(normalizedEmail) } });
  } catch (error) {
    const message = error instanceof Error ? error.message.replace(/mongodb(?:\+srv)?:\/\/[^\s]*/gi, "mongodb://[redacted]") : "Unknown error";
    console.error(`[auth/entry] ${error instanceof Error ? error.name : "Error"}: ${message}`);
    return NextResponse.json({ error: "Hozircha hisobga kirib bo‘lmadi. Keyinroq urinib ko‘ring." }, { status: 503 });
  }
}

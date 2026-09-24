import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { Mission } from "@/models/Mission";

type SegmentInput = { order: number; startTime: number; endTime: number; text: string; points: number };
function parseSegments(value: unknown): SegmentInput[] | null {
  if (!Array.isArray(value) || value.length > 100) return null;
  const segments: SegmentInput[] = [];
  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object") return null;
    const segment = item as Record<string, unknown>;
    const startTime = Number(segment.startTime); const endTime = Number(segment.endTime); const points = Number(segment.points);
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || startTime < 0 || endTime <= startTime || !Number.isInteger(points) || points < 0 || typeof segment.text !== "string" || !segment.text.trim() || (index > 0 && startTime < segments[index - 1].endTime)) return null;
    segments.push({ order: index + 1, startTime, endTime, text: segment.text.trim(), points });
  }
  return segments;
}

export async function PATCH(request: Request, context: RouteContext<"/api/admin/missions/[id]">) {
  if (!await isAdminSession()) return NextResponse.json({ error: "Admin ruxsati kerak." }, { status: 403 });
  const { id } = await context.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Mashq topilmadi." }, { status: 404 });
  try {
    const input: unknown = await request.json();
    if (!input || typeof input !== "object") return NextResponse.json({ error: "Maydonlarni tekshiring." }, { status: 400 });
    const body = input as Record<string, unknown>;
    await connectToDatabase();
    if (Object.keys(body).length === 1 && typeof body.published === "boolean") {
      const mission = await Mission.findByIdAndUpdate(id, { $set: { published: body.published } }, { returnDocument: "after" });
      if (!mission) return NextResponse.json({ error: "Mashq topilmadi." }, { status: 404 });
      return NextResponse.json({ published: mission.published });
    }
    const segments = parseSegments(body.segments);
    let videoUrl: URL | null = null;
    try { if (typeof body.videoUrl === "string" && body.videoUrl.trim()) videoUrl = new URL(body.videoUrl); } catch { return NextResponse.json({ error: "Cloudinary video havolasi noto‘g‘ri." }, { status: 400 }); }
    if (typeof body.title !== "string" || !body.title.trim() || typeof body.description !== "string" || typeof body.fullTranscript !== "string" || !body.fullTranscript.trim() || ![1, 2, 3, 4].includes(Number(body.level)) || !["Oson", "O‘rta", "Qiyin"].includes(String(body.difficulty)) || (videoUrl && (videoUrl.protocol !== "https:" || (videoUrl.hostname !== "res.cloudinary.com" && !videoUrl.hostname.endsWith(".cloudinary.com")))) || !segments || typeof body.published !== "boolean") return NextResponse.json({ error: "Mashq nomi, to‘liq matni va jumlalarni tekshiring. Segmentlar ketma-ket, video esa Cloudinary HTTPS havolasi bo‘lsin." }, { status: 400 });
    const mission = await Mission.findByIdAndUpdate(id, { $set: { title: body.title.trim(), description: body.description.trim(), level: Number(body.level), difficulty: body.difficulty, published: body.published, "video.url": videoUrl?.toString() ?? "", "video.duration": segments.at(-1)?.endTime ?? 0, segments, totalPoints: segments.reduce((total, segment) => total + segment.points, 0), fullTranscript: body.fullTranscript.trim() } }, { returnDocument: "after", runValidators: true });
    if (!mission) return NextResponse.json({ error: "Mashq topilmadi." }, { status: 404 });
    return NextResponse.json({ mission: { _id: mission.id, title: mission.title, description: mission.description, level: mission.level, difficulty: mission.difficulty, order: mission.order, published: mission.published, video: mission.video, segments: mission.segments, totalPoints: mission.totalPoints, fullTranscript: mission.fullTranscript } });
  } catch { return NextResponse.json({ error: "Mashqni yangilab bo‘lmadi." }, { status: 503 }); }
}

export async function DELETE(_request: Request, context: RouteContext<"/api/admin/missions/[id]">) {
  if (!await isAdminSession()) return NextResponse.json({ error: "Admin ruxsati kerak." }, { status: 403 });
  const { id } = await context.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Mashq topilmadi." }, { status: 404 });
  try {
    await connectToDatabase();
    const mission = await Mission.findByIdAndDelete(id);
    if (!mission) return NextResponse.json({ error: "Mashq topilmadi." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Mashqni o‘chirib bo‘lmadi." }, { status: 503 }); }
}

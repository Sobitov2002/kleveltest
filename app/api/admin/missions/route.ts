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
    const startTime = Number(segment.startTime);
    const endTime = Number(segment.endTime);
    const points = Number(segment.points);
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || startTime < 0 || endTime <= startTime || !Number.isInteger(points) || points < 0 || typeof segment.text !== "string" || !segment.text.trim()) return null;
    if (index > 0 && startTime < segments[index - 1].endTime) return null;
    segments.push({ order: index + 1, startTime, endTime, text: segment.text.trim(), points });
  }
  return segments;
}

function validCloudinaryUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return value === "";
  try { const url = new URL(value); return url.protocol === "https:" && (url.hostname === "res.cloudinary.com" || url.hostname.endsWith(".cloudinary.com")); } catch { return false; }
}

export async function GET() {
  if (!await isAdminSession()) return NextResponse.json({ error: "Admin ruxsati kerak." }, { status: 403 });
  try {
    await connectToDatabase();
    const missions = await Mission.find().sort({ level: 1, order: 1 }).lean();
    return NextResponse.json({ missions });
  } catch { return NextResponse.json({ error: "Mashqlarni yuklab bo‘lmadi." }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!await isAdminSession()) return NextResponse.json({ error: "Admin ruxsati kerak." }, { status: 403 });
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Maydonlarni tekshiring." }, { status: 400 });
    const input = body as Record<string, unknown>;
    const segments = parseSegments(input.segments ?? []);
    if (typeof input.title !== "string" || !input.title.trim() || typeof input.description !== "string" || typeof input.fullTranscript !== "string" || !input.fullTranscript.trim() || ![1, 2, 3, 4].includes(Number(input.level)) || !["Oson", "O‘rta", "Qiyin"].includes(String(input.difficulty)) || !validCloudinaryUrl(input.videoUrl) || !segments) return NextResponse.json({ error: "Mashq nomi, to‘liq matni va jumlalarni tekshiring. Segment vaqtlari ketma-ket, video esa Cloudinary HTTPS havolasi bo‘lsin." }, { status: 400 });
    await connectToDatabase();
    const order = await Mission.countDocuments({ level: Number(input.level) }) + 1;
    const mission = await Mission.create({ title: input.title.trim(), description: input.description.trim(), level: Number(input.level), difficulty: input.difficulty, order, published: input.published === true, video: { provider: "cloudinary", url: input.videoUrl, duration: segments.at(-1)?.endTime ?? 0 }, segments, totalPoints: segments.reduce((total, segment) => total + segment.points, 0), fullTranscript: input.fullTranscript.trim() });
    return NextResponse.json({ mission: { _id: mission.id, title: mission.title, description: mission.description, level: mission.level, difficulty: mission.difficulty, order: mission.order, published: mission.published, video: mission.video, segments: mission.segments, totalPoints: mission.totalPoints, fullTranscript: mission.fullTranscript } }, { status: 201 });
  } catch { return NextResponse.json({ error: "Mashqni yaratib bo‘lmadi." }, { status: 503 }); }
}

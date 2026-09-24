"use client";

import { FormEvent, useRef, useState } from "react";
import { Plus, Save, Trash2, Video } from "lucide-react";

export type EditableSegment = { startTime: number; endTime: number; text: string; points: number };
export type EditableMission = { _id: string; title: string; description: string; level: number; difficulty: string; order: number; published: boolean; video?: { url?: string }; segments?: EditableSegment[]; fullTranscript?: string };

const fieldClass = "mt-2 h-11 w-full rounded-xl border border-[#e5e6ed] bg-white px-3 text-sm outline-none focus:border-[#827ae5]";

export default function MissionEditor({ mission, onSaved, onCancel }: { mission: EditableMission | null; onSaved: (mission: EditableMission) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(mission?.title ?? "");
  const [description, setDescription] = useState(mission?.description ?? "");
  const [fullTranscript, setFullTranscript] = useState(mission?.fullTranscript ?? "");
  const [level, setLevel] = useState(mission?.level ?? 1);
  const [difficulty, setDifficulty] = useState(mission?.difficulty ?? "Oson");
  const [published, setPublished] = useState(mission?.published ?? false);
  const [videoUrl, setVideoUrl] = useState(mission?.video?.url ?? "");
  const [segments, setSegments] = useState<EditableSegment[]>(mission?.segments?.map(({ startTime, endTime, text, points }) => ({ startTime, endTime, text, points })) ?? [{ startTime: 0, endTime: 4, text: "", points: 100 }]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function updateSegment(index: number, key: keyof EditableSegment, value: string) {
    setSegments((current) => current.map((segment, currentIndex) => currentIndex === index ? { ...segment, [key]: key === "text" ? value : Number(value) } : segment));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const url = mission ? `/api/admin/missions/${mission._id}` : "/api/admin/missions";
    try {
      const response = await fetch(url, { method: mission ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, fullTranscript, level, difficulty, published, videoUrl: videoUrl.trim(), segments }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Mashqni saqlab bo‘lmadi.");
      onSaved(result.mission as EditableMission);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Mashqni saqlab bo‘lmadi."); }
    finally { setBusy(false); }
  }

  return <form onSubmit={save} className="h-fit rounded-2xl border border-[#e8e9f0] bg-white p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><h2 className="font-bold">{mission ? "Mashqni tahrirlash" : "Yangi mashq"}</h2>{mission && <span className="rounded-lg bg-[#f0efff] px-2.5 py-1.5 text-[10px] font-bold text-[#635bdb]">#{mission.order}</span>}</div>
    <label className="mb-4 block text-xs font-semibold text-[#5d5f70]">Mashq nomi<input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} placeholder="Masalan: Koreyscha salomlashuv" className={fieldClass}/></label>
    <label className="mb-4 block text-xs font-semibold text-[#5d5f70]">Qisqa tavsif<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} placeholder="Mashqda nimalar o‘rganiladi?" className="mt-2 min-h-20 w-full rounded-xl border border-[#e5e6ed] p-3 text-sm outline-none focus:border-[#827ae5]"/></label>
    <label className="mb-4 block text-xs font-semibold text-[#5d5f70]">Mashqning to‘liq matni<textarea required value={fullTranscript} onChange={(event) => setFullTranscript(event.target.value)} maxLength={12000} placeholder="Videoning haqiqiy to‘liq koreyscha matnini kiriting…" className="mt-2 min-h-24 w-full rounded-xl border border-[#e5e6ed] p-3 text-sm leading-6 outline-none focus:border-[#827ae5]"/><span className="mt-1 block text-[10px] font-normal text-[#999aa8]">User 90% o‘zlashtirgach, matn faqat o‘z profilida ochiladi.</span></label>
    <div className="mb-5 grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-[#5d5f70]">Bosqich<select value={level} onChange={(event) => setLevel(Number(event.target.value))} className={fieldClass}><option value={1}>1 · Boshlang‘ich</option><option value={2}>2 · O‘rta</option><option value={3}>3 · Yuqori</option><option value={4}>4 · Mukammal</option></select></label><label className="text-xs font-semibold text-[#5d5f70]">Qiyinlik<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className={fieldClass}><option>Oson</option><option>O‘rta</option><option>Qiyin</option></select></label></div>

    <div className="mb-5 rounded-xl border border-[#e8e7f7] bg-[#fafaff] p-4"><label className="block text-xs font-bold text-[#56586b]"><span className="flex items-center gap-2"><Video size={15} className="text-[#635bdb]"/> Cloudinary video havolasi</span><input type="url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://res.cloudinary.com/.../video/upload/...mp4" className={fieldClass}/></label><p className="mt-2 text-[10px] leading-4 text-[#9394a3]">Cloudinary’dagi videoning HTTPS linkini shu yerga qo‘ying. Videoni saytga qayta yuklash shart emas.</p>{videoUrl && <video ref={videoRef} key={videoUrl} src={videoUrl} controls preload="metadata" className="mt-3 max-h-48 w-full rounded-lg bg-black"/>}</div>

    <div className="mb-4 flex items-end justify-between gap-3"><div><h3 className="text-xs font-bold text-[#56586b]">Jumlalar va to‘xtash vaqtlari</h3><p className="mt-1 text-[10px] text-[#9293a2]">Video vaqtini soniyada kiriting. Har qatorda bitta jumla.</p></div><button type="button" onClick={() => setSegments((items) => [...items, { startTime: items.at(-1)?.endTime ?? 0, endTime: (items.at(-1)?.endTime ?? 0) + 4, text: "", points: 100 }])} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#e6e5f2] px-3 py-2 text-[11px] font-semibold text-[#635bdb]"><Plus size={14}/> Jumla qo‘shish</button></div>
    <div className="space-y-3">{segments.map((segment, index) => <div key={index} className="rounded-xl border border-[#ececf2] p-3"><div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-bold text-[#686a7b]">Jumla {index + 1}</span>{segments.length > 1 && <button type="button" aria-label={`Jumla ${index + 1} ni o‘chirish`} onClick={() => setSegments((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="rounded-md p-1.5 text-[#c87369] hover:bg-[#fff3f1]"><Trash2 size={14}/></button>}</div><div className="grid grid-cols-2 gap-2"><label className="text-[10px] font-semibold text-[#858697]">Boshlanish · soniya<input type="number" min="0" step="0.1" required value={segment.startTime} onChange={(event) => updateSegment(index, "startTime", event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#e7e7ee] px-2 text-xs text-[#343548]"/><button type="button" disabled={!videoUrl} onClick={() => updateSegment(index, "startTime", String(Number((videoRef.current?.currentTime ?? 0).toFixed(1))))} className="mt-1 text-left text-[10px] font-semibold text-[#635bdb] disabled:text-[#b4b4bd]">Hozirgi vaqtni olish</button></label><label className="text-[10px] font-semibold text-[#858697]">To‘xtash · soniya<input type="number" min="0.1" step="0.1" required value={segment.endTime} onChange={(event) => updateSegment(index, "endTime", event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#e7e7ee] px-2 text-xs text-[#343548]"/><button type="button" disabled={!videoUrl} onClick={() => updateSegment(index, "endTime", String(Number((videoRef.current?.currentTime ?? 0).toFixed(1))))} className="mt-1 text-left text-[10px] font-semibold text-[#635bdb] disabled:text-[#b4b4bd]">Hozirgi vaqtni olish</button></label></div><label className="mt-2 block text-[10px] font-semibold text-[#858697]">Eshitilishi kerak bo‘lgan koreyscha jumla<input required value={segment.text} onChange={(event) => updateSegment(index, "text", event.target.value)} placeholder="안녕하세요." className="mt-1 h-10 w-full rounded-lg border border-[#e7e7ee] px-3 text-[14px] text-[#343548]"/></label><label className="mt-2 block w-28 text-[10px] font-semibold text-[#858697]">Ball<input type="number" min="0" step="1" required value={segment.points} onChange={(event) => updateSegment(index, "points", event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#e7e7ee] px-3 text-xs text-[#343548]"/></label></div>)}</div>
    <label className="my-5 flex items-center gap-2 text-xs text-[#656779]"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)}/> Mashqni nashr qilish</label>
    {error && <p role="alert" className="mb-4 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-800">{error}</p>}
    <div className="flex gap-2"><button disabled={busy} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#635bdb] py-3 text-sm font-semibold text-white disabled:opacity-60"><Save size={15}/>{busy ? "Saqlanmoqda…" : mission ? "O‘zgarishlarni saqlash" : "Mashqni yaratish"}</button><button type="button" onClick={onCancel} className="rounded-xl border border-[#e6e7ed] px-4 text-sm font-semibold text-[#686a7b]">Bekor</button></div>
  </form>;
}

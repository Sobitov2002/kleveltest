"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Check, Clock3, LockKeyhole, Save, Trophy } from "lucide-react";

type ProfileData = { user: { firstName: string; lastName: string; profileStatus: string; totalScore: number; totalAttempts: number; totalErrors: number; completedMissions: number; currentLevel: number; rewardStickers: { id: string; emoji: string; label: string; message: string; awardedAt: string }[] }; missions: { id: string; title: string; level: number; order: number; masteryPercent: number; completed: boolean; fullTranscript?: string }[] };

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/profile").then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error); setData(result); })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Profilni ochib bo‘lmadi."))
      .finally(() => setLoading(false));
  }, []);

  return <main className="min-h-screen bg-[#f8f9fc] px-4 pb-12 text-[#1e2030] sm:px-6"><header className="mx-auto flex h-[70px] max-w-4xl items-center"><Link href="/" className="flex items-center gap-2 text-[13px] font-semibold text-[#737587]"><ArrowLeft size={16}/> Bosh sahifa</Link></header><div className="mx-auto max-w-4xl pt-5"><p className="mb-2 text-[11px] font-bold tracking-[1.3px] text-[#7770d2]">SHAXSIY MAYDON</p><h1 className="text-[28px] font-bold tracking-[-.8px]">Mening profilim</h1>{loading ? <div className="mt-7 h-40 animate-pulse rounded-2xl bg-white"/> : error ? <p role="alert" className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error} <Link href="/" className="font-semibold underline">Kirish sahifasiga qayting</Link></p> : data && <><section className="mt-6 grid gap-3 sm:grid-cols-3"><ProfileStat icon={<Trophy size={17}/>} label="Jami ball" value={`${data.user.totalScore} P`}/><ProfileStat icon={<Check size={17}/>} label="90% o‘zlashtirilgan" value={`${data.user.completedMissions} mashq`}/><ProfileStat icon={<Clock3 size={17}/>} label="Urinishlar" value={`${data.user.totalAttempts}`}/></section><ProfileStickers stickers={data.user.rewardStickers ?? []}/><ProfileStatusEditor initialStatus={data.user.profileStatus ?? ""}/><h2 className="mb-3 mt-9 text-lg font-bold">Mashqlar va to‘liq matnlar</h2><p className="mb-5 text-xs leading-5 text-[#858697]">To‘liq koreyscha matn mashqni yakunlab, jumlalarning kamida 90% o‘zlashtirilgach shu profilda ochiladi.</p><div className="space-y-4">{data.missions.map((mission) => <article key={mission.id} className="rounded-2xl border border-[#e8e9f0] bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="mb-1 text-[10px] font-bold tracking-wide text-[#7770d2]">{mission.level}-BOSQICH · MASHQ {mission.order}</p><h3 className="text-sm font-bold">{mission.title}</h3></div><span className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${mission.completed ? "bg-[#eaf7f0] text-[#40976f]" : "bg-[#f4f4f8] text-[#858697]"}`}>{mission.masteryPercent}% · {mission.completed ? "O‘zlashtirildi" : "Davom etmoqda"}</span></div>{mission.fullTranscript ? <div className="mt-4 rounded-xl bg-[#f8f8fc] p-4"><p className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-wide text-[#7770d2]"><BookOpen size={14}/> TO‘LIQ MATN</p><p lang="ko" className="whitespace-pre-wrap text-[15px] leading-7">{mission.fullTranscript}</p></div> : <p className="mt-4 flex items-center gap-2 rounded-xl bg-[#f8f8fc] p-3 text-[11px] text-[#9697a6]"><LockKeyhole size={14}/> Matn 90% o‘zlashtirilgach ochiladi.</p>}</article>)}</div></>}</div></main>;
}

function ProfileStatusEditor({ initialStatus }: { initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileStatus: status }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage("Status hamma uchun ko‘rinadi.");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Statusni saqlab bo‘lmadi."); }
    finally { setSaving(false); }
  }
  return <section className="mt-4 rounded-2xl border border-[#e8e9f0] bg-white p-4"><label className="block text-xs font-bold text-[#56586b]">Profil statusi <span className="font-normal text-[#9899a8]">· boshqalarga ko‘rinadi</span><input maxLength={100} value={status} onChange={(event) => setStatus(event.target.value)} placeholder="Masalan: Koreys tilini o‘rganyapman!" className="mt-2 h-11 w-full rounded-xl border border-[#e5e6ed] px-3 text-sm outline-none focus:border-[#827ae5]"/></label><div className="mt-3 flex items-center justify-between"><p role="status" className="text-[10px] text-[#858697]">{message}</p><button onClick={() => void save()} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-[#635bdb] px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-50"><Save size={13}/>{saving ? "Saqlanmoqda…" : "Statusni saqlash"}</button></div></section>;
}

function ProfileStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-[#e8e9f0] bg-white p-4"><div className="mb-3 flex items-center justify-between text-xs text-[#858697]"><span>{label}</span><span className="text-[#635bdb]">{icon}</span></div><p className="text-xl font-bold">{value}</p></div>;
}


function ProfileStickers({ stickers }: { stickers: ProfileData["user"]["rewardStickers"] }) {
  const latest = stickers.at(-1);
  return <section className="mt-4 rounded-2xl border border-[#eee5c9] bg-white p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold tracking-wide text-[#a77c25]">USTOZ RAG‘BATLARI</p><h2 className="mt-0.5 text-sm font-bold">Profil stikerlari</h2></div>{latest && <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff5df] text-2xl shadow-sm" title={latest.label}>{latest.emoji}</span>}</div>{stickers.length ? <div className="mt-3 flex flex-wrap gap-2">{stickers.map((sticker, index) => <span key={`${sticker.id}-${sticker.awardedAt}-${index}`} title={`${sticker.label}: ${sticker.message}`} className="rounded-full border border-[#f0ead7] bg-[#fffdf8] px-3 py-1.5 text-xs">{sticker.emoji} {sticker.label}</span>)}</div> : <p className="mt-2 text-[11px] text-[#9293a1]">Ustoz yuborgan stikerlar shu yerda saqlanadi.</p>}</section>;
}

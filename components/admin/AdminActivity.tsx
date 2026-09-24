"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, MessageCircle, RefreshCw } from "lucide-react";

type AttemptActivity = { id: string; userName: string; missionTitle: string; level: number; order: number; masteryPercent: number; score: number; createdAt: string };
type DiscussionActivity = { id: string; userName: string; missionTitle: string; level: number; order: number; text: string; createdAt: string };

export default function AdminActivity() {
  const [attempts, setAttempts] = useState<AttemptActivity[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionActivity[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/activity", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Faoliyatlarni yuklab bo‘lmadi.");
      setAttempts(result.attempts); setDiscussions(result.discussions); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Faoliyatlarni yuklab bo‘lmadi."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const dateTime = (value: string) => new Date(value).toLocaleString();

  return <section className="mt-12 border-t border-[#e6e7ee] pt-9"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[11px] font-bold tracking-[1.3px] text-[#7770d2]">ADMIN FAOLIYATI</p><h2 className="flex items-center gap-2 text-[22px] font-bold"><Activity size={20} className="text-[#635bdb]"/> Mashqdan keyingi faollik</h2><p className="mt-1 text-[12px] text-[#898a99]">Yakunlangan urinishlar va mashq muhokamalaridagi xabarlar.</p></div><button onClick={() => void load()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-[#e3e4ed] bg-white px-3 py-2 text-xs font-semibold text-[#5b5d6e] disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Yangilash</button></div>
    {error && <p role="alert" className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">{error}</p>}
    <div className="mt-6 grid items-start gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-[#e8e9f0] bg-white p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-bold">Mashqni tugatganlar</h3><span className="rounded-full bg-[#eeedff] px-2 py-1 text-[10px] font-bold text-[#635bdb]">{attempts.length}</span></div><div className="max-h-[560px] space-y-2 overflow-y-auto">{attempts.length ? attempts.map((attempt) => <article key={attempt.id} className="rounded-xl bg-[#f8f8fc] p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-bold">{attempt.userName}</p><p className="mt-0.5 line-clamp-1 text-[10px] text-[#77798a]">{attempt.level}-bosqich · {attempt.missionTitle}</p></div><span className={`shrink-0 rounded-md px-2 py-1 text-[9px] font-bold ${attempt.masteryPercent >= 90 ? "bg-[#eaf7f0] text-[#40976f]" : "bg-[#fff2e6] text-[#bc7938]"}`}>{attempt.masteryPercent}%</span></div><p className="mt-2 text-[9px] text-[#999aa8]">{attempt.score} ball · {dateTime(attempt.createdAt)}</p></article>) : <p className="rounded-xl bg-[#f8f8fc] p-5 text-center text-[11px] text-[#999aa8]">{loading ? "Yuklanmoqda…" : "Tugatishlar hali yo‘q."}</p>}</div></section>
      <section className="rounded-2xl border border-[#e8e9f0] bg-white p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-bold"><MessageCircle size={15} className="text-[#635bdb]"/> Mashq muhokamalari</h3><span className="rounded-full bg-[#eeedff] px-2 py-1 text-[10px] font-bold text-[#635bdb]">{discussions.length}</span></div><div className="max-h-[560px] space-y-2 overflow-y-auto">{discussions.length ? discussions.map((message) => <article key={message.id} className="rounded-xl bg-[#f8f8fc] p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-bold">{message.userName}</p><p className="mt-0.5 line-clamp-1 text-[10px] text-[#77798a]">{message.level}-bosqich · {message.missionTitle}</p></div><time className="shrink-0 text-[9px] text-[#999aa8]">{dateTime(message.createdAt)}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-[#4f5060]">{message.text}</p></article>) : <p className="rounded-xl bg-[#f8f8fc] p-5 text-center text-[11px] text-[#999aa8]">{loading ? "Yuklanmoqda…" : "Muhokama xabarlari hali yo‘q."}</p>}</div></section></div>
  </section>;
}

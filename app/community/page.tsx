"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, Send, Star, Users, X } from "lucide-react";

type CommunityUser = { id: string; name: string; profileStatus: string; totalScore: number; completedMissions: number; currentLevel: number; average: number; count: number; myStars: number; rewardStickers: { id: string; emoji: string; label: string; message: string; awardedAt: string }[] };
type ChatMessage = { id: string; fromUserId: string; text: string; createdAt: string };

export default function CommunityPage() {
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const [ownUserId, setOwnUserId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatUser, setChatUser] = useState<CommunityUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  useEffect(() => {
    fetch("/api/users").then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error); setUsers(result.users); setOwnUserId(result.ownUserId ?? ""); const queryUserId = new URLSearchParams(window.location.search).get("user"); const queryUser = (result.users as CommunityUser[]).find((user) => user.id === queryUserId); if (queryUser && queryUser.id !== result.ownUserId) { setChatUser(queryUser); setChatLoading(true); } })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Userlarni yuklab bo‘lmadi."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!chatUser) return;
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/messages?userId=${encodeURIComponent(chatUser.id)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (active) setMessages(result.messages);
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Xabarlarni yuklab bo‘lmadi."); }
      finally { if (active) setChatLoading(false); }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [chatUser]);

  async function rate(user: CommunityUser, stars: number) {
    try {
      const response = await fetch(`/api/users/${user.id}/rating`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stars }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setUsers((items) => items.map((item) => item.id === user.id ? { ...item, average: result.average, count: result.count, myStars: result.myStars } : item)); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Yulduzni yuborib bo‘lmadi."); }
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!chatUser || !draft.trim()) return;
    try {
      const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: chatUser.id, text: draft }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessages((current) => [...current, result.message]); setDraft(""); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Xabar yuborilmadi."); }
  }

  return <main className="min-h-screen bg-[#f8f9fc] px-4 pb-12 text-[#1e2030] sm:px-6"><header className="mx-auto flex h-[70px] max-w-4xl items-center"><Link href="/" className="flex items-center gap-2 text-[13px] font-semibold text-[#737587]"><ArrowLeft size={16}/> Bosh sahifa</Link></header><section className="mx-auto max-w-4xl pt-5"><p className="mb-2 text-[11px] font-bold tracking-[1.3px] text-[#7770d2]">KLEVELTEST JAMOASI</p><h1 className="flex items-center gap-3 text-[28px] font-bold tracking-[-.8px]"><Users className="text-[#635bdb]"/> O‘rganuvchilar</h1><p className="mt-2 text-sm text-[#858697]">Boshqa o‘rganuvchilarga xabar yozing yoki yulduz bilan baholang.</p>{error && <p role="alert" className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>}{loading ? <div className="mt-7 h-40 animate-pulse rounded-2xl bg-white"/> : users.length ? <div className="mt-7 grid gap-4 sm:grid-cols-2">{users.map((user) => <article key={user.id} className="rounded-2xl border border-[#e8e9f0] bg-white p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eeedff] text-xs font-bold text-[#635bdb]">{user.name.split(" ").slice(0, 2).map((part) => part[0]).join("")}</span><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-bold"><Link href={`/users/${user.id}`} className="hover:text-[#635bdb]">{user.name}</Link></h2><p className="mt-0.5 min-h-4 text-xs text-[#858697]">{user.profileStatus || "Koreys tilini o‘rganyapman"}</p>{user.rewardStickers?.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{user.rewardStickers.slice(-3).map((sticker) => <span key={`${sticker.id}-${sticker.awardedAt}`} title={`${sticker.label}: ${sticker.message}`} className="rounded-full bg-[#fff6df] px-1.5 py-0.5 text-[10px]">{sticker.emoji} {sticker.label}</span>)}</div>}</div><div className="text-right"><p className="flex items-center justify-end gap-1 text-sm font-bold text-[#b88729]"><Star size={14} fill="currentColor"/>{user.average.toFixed(1)}</p><p className="mt-0.5 text-[9px] text-[#999aa8]">{user.count} baho</p></div></div><div className="mt-4 flex items-center justify-between border-t border-[#f0f0f4] pt-3"><p className="text-[10px] text-[#9293a2]">{user.totalScore} P · {user.completedMissions} mashq · {user.currentLevel}-bosqich</p>{ownUserId === user.id ? <span className="text-[10px] text-[#a0a1ad]">O‘zingiz</span> : <div aria-label="Yulduz bilan baholash" className="flex items-center gap-0.5">{[1, 2, 3, 4, 5].map((stars) => <button key={stars} aria-label={`${stars} yulduz berish`} onClick={() => void rate(user, stars)} className="rounded p-1 text-[#e1e2e9] transition hover:scale-110 hover:text-[#e8b84f]"> <Star size={17} fill={user.myStars >= stars ? "currentColor" : "none"} className={user.myStars >= stars ? "text-[#e8b84f]" : ""}/></button>)}</div>}</div>{ownUserId !== user.id && <button onClick={() => { setChatUser(user); setMessages([]); setChatLoading(true); setError(""); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f1f0ff] py-2.5 text-xs font-semibold text-[#625bd2] hover:bg-[#e9e7ff]"><MessageCircle size={15}/> Xabar yozish</button>}</article>)}</div> : <p className="mt-7 rounded-2xl border border-dashed border-[#dedfe8] bg-white p-8 text-center text-sm text-[#9293a2]">Hozircha foydalanuvchilar yo‘q.</p>}</section>{chatUser && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setChatUser(null); }}><section role="dialog" aria-modal="true" aria-label={`${chatUser.name} bilan yozishma`} className="flex h-[min(80vh,620px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"><header className="flex items-center justify-between border-b border-[#eeeef3] px-4 py-3"><div><h2 className="text-sm font-bold">{chatUser.name}</h2><p className="text-[11px] text-[#999aa8]">Shaxsiy yozishma</p></div><button aria-label="Yopish" onClick={() => setChatUser(null)} className="rounded-lg p-2 text-[#777887] hover:bg-[#f4f4f8]"><X size={18}/></button></header><div className="flex-1 space-y-2 overflow-y-auto bg-[#fafaff] p-4">{chatLoading ? <p className="text-center text-xs text-[#999aa8]">Xabarlar yuklanmoqda…</p> : messages.length ? messages.map((message) => <div key={message.id} className={`flex ${message.fromUserId === ownUserId ? "justify-end" : "justify-start"}`}><p className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${message.fromUserId === ownUserId ? "bg-[#635bdb] text-white" : "bg-white text-[#343545] shadow-sm"}`}>{message.text}<span className="mt-1 block text-right text-[9px] opacity-60">{new Date(message.createdAt).toLocaleString()}</span></p></div>) : <p className="pt-8 text-center text-xs text-[#999aa8]">Hozircha xabar yo‘q. Birinchi bo‘lib yozing.</p>}</div><form onSubmit={(event) => void sendMessage(event)} className="flex gap-2 border-t border-[#eeeef3] p-3"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Xabar matni" maxLength={2000} rows={1} placeholder="Xabar yozing…" className="max-h-28 min-h-11 flex-1 resize-y rounded-xl border border-[#e5e5ed] px-3 py-2.5 text-sm outline-none focus:border-[#817be3]"/><button type="submit" disabled={!draft.trim()} aria-label="Xabarni yuborish" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#635bdb] text-white disabled:opacity-40"><Send size={17}/></button></form></section></div>}</main>;
}

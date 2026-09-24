"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageCircle, Send } from "lucide-react";

type DiscussionMessage = { id: string; userId: string; name: string; text: string; createdAt: string };
export default function MissionDiscussion({ missionId, ownUserId }: { missionId: string; ownUserId: string }) {
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const load = async () => { try { const response = await fetch(`/api/missions/${missionId}/discussion`); const data = await response.json(); if (!response.ok) throw new Error(data.error); if (active) setMessages(data.messages); } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Muhokama yuklanmadi."); } };
    void load(); const timer = window.setInterval(() => void load(), 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [missionId]);
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!draft.trim()) return;
    try { const response = await fetch(`/api/missions/${missionId}/discussion`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: draft }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setMessages((items) => [...items, data.message]); setDraft(""); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Xabar yuborilmadi."); }
  }
  return <section className="mt-5 rounded-2xl border border-[#e7e6f5] bg-white p-4 text-left sm:p-5"><div className="mb-3 flex items-center gap-2"><MessageCircle size={17} className="text-[#635bdb]"/><div><h3 className="text-sm font-bold">Mashq muhokamasi</h3><p className="text-[10px] text-[#9293a1]">Bu mashqni bajarganlar bilan fikr almashing</p></div></div><div className="max-h-52 space-y-2 overflow-y-auto rounded-xl bg-[#f8f8fc] p-3">{messages.length ? messages.map((message) => <div key={message.id} className={`flex ${message.userId === ownUserId ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-xl px-3 py-2 ${message.userId === ownUserId ? "bg-[#635bdb] text-white" : "bg-white text-[#343545] shadow-sm"}`}><p className="mb-0.5 text-[9px] font-bold opacity-70">{message.userId === ownUserId ? "Siz" : message.name}</p><p className="whitespace-pre-wrap break-words text-xs">{message.text}</p></div></div>) : <p className="py-4 text-center text-[11px] text-[#999aa8]">Birinchi bo‘lib fikringizni yozing.</p>}</div>{error && <p role="alert" className="mt-2 text-[11px] text-[#c1554b]">{error}</p>}<form onSubmit={(event) => void send(event)} className="mt-3 flex gap-2"><input aria-label="Mashq haqida xabar" maxLength={1000} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Mashq haqida yozing…" className="h-10 min-w-0 flex-1 rounded-lg border border-[#e5e5ed] px-3 text-xs outline-none focus:border-[#817be3]"/><button aria-label="Yuborish" disabled={!draft.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#635bdb] text-white disabled:opacity-40"><Send size={15}/></button></form></section>;
}

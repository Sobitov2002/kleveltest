"use client";

import { useEffect, useState } from "react";
import { Bell, MessageCircle, Star, X } from "lucide-react";

type Item = { id: string; kind: "message" | "rating"; actorId: string; actor: string; text: string; createdAt: string };

export default function NotificationBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("sori.notifications.seen") ?? "[]") as string[]; } catch { return []; }
  });
  useEffect(() => {
    let active = true;
    const load = async () => { try { const response = await fetch("/api/notifications"); if (!response.ok) return; const data = await response.json(); if (active) setItems(data.items); } catch { /* keep previous notifications */ } };
    void load(); const timer = window.setInterval(() => void load(), 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  const unread = items.filter((item) => !seen.includes(item.id)).length;
  function toggle() {
    const next = !open; setOpen(next);
    if (next) { const ids = items.map((item) => item.id); setSeen(ids); localStorage.setItem("sori.notifications.seen", JSON.stringify(ids)); }
  }
  return <div className="relative"><button onClick={toggle} aria-label={`Bildirishnomalar${unread ? `, ${unread} ta yangi` : ""}`} className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#e8e9f0] text-[#5b5d6e] hover:bg-[#f8f8fb]"><Bell size={17}/>{unread > 0 && <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#ed6c61] px-1 text-[9px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}</button>{open && <div className="absolute right-0 top-12 z-40 w-[min(90vw,360px)] overflow-hidden rounded-2xl border border-[#e8e9f0] bg-white shadow-xl"><div className="flex items-center justify-between border-b border-[#f0f0f4] px-4 py-3"><div><h2 className="text-sm font-bold">Bildirishnomalar</h2><p className="text-[10px] text-[#9697a5]">Xabarlar va yulduz baholari</p></div><button onClick={() => setOpen(false)} aria-label="Yopish" className="rounded p-1 text-[#9697a5]"><X size={16}/></button></div><div className="max-h-[370px] overflow-y-auto">{items.length ? items.map((item) => <a key={item.id} href={item.kind === "message" ? `/community?user=${encodeURIComponent(item.actorId)}` : `/users/${encodeURIComponent(item.actorId)}`} onClick={() => setOpen(false)} className="flex gap-3 border-b border-[#f5f5f8] px-4 py-3 last:border-0 hover:bg-[#fafaff]"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${item.kind === "message" ? "bg-[#eeedff] text-[#635bdb]" : "bg-[#fff4df] text-[#d69b32]"}`}>{item.kind === "message" ? <MessageCircle size={15}/> : <Star size={15} fill="currentColor"/>}</span><span className="min-w-0"><span className="block text-xs leading-5"><b>{item.actor}</b> {item.kind === "message" ? "sizga xabar yozdi:" : item.text}</span>{item.kind === "message" && <span className="mt-1 block line-clamp-2 break-words text-[11px] text-[#858697]">{item.text}</span>}<time className="mt-1 block text-[9px] text-[#a1a2af]">{new Date(item.createdAt).toLocaleString()}</time></span></a>) : <p className="p-8 text-center text-xs text-[#999aa8]">Hozircha bildirishnoma yo‘q.</p>}</div><a href="/community" onClick={() => setOpen(false)} className="block border-t border-[#f0f0f4] px-4 py-3 text-center text-xs font-semibold text-[#635bdb]">Jamoaga o‘tish</a></div>}</div>;
}

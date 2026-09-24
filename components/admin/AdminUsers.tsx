"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, Check, Search, Send, ShieldCheck, Trash2 } from "lucide-react";
import { rewardStickers, type RewardStickerId } from "@/lib/listening/rewards";

type ManagedUser = { _id: string; firstName: string; lastName: string; email: string; profileStatus?: string; totalScore: number; totalAttempts: number; totalErrors: number; completedMissions: number; currentLevel: number; status: "active" | "suspended"; createdAt: string };

export default function AdminUsers() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/users").then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (active) { setUsers(result.users); setTotal(result.total); }
    }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Foydalanuvchilarni yuklab bo‘lmadi."); });
    return () => { active = false; };
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query ? users.filter((user) => `${user.firstName} ${user.lastName} ${user.email}`.toLocaleLowerCase().includes(query)) : users;
  }, [users, search]);

  async function updateUser(user: ManagedUser, body: Record<string, string | number>) {
    const response = await fetch(`/api/admin/users/${user._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Foydalanuvchini yangilab bo‘lmadi.");
    setUsers((items) => items.map((item) => item._id === user._id ? { ...item, ...result.user } : item));
  }

  async function removeUser(user: ManagedUser) {
    if (!window.confirm(`${user.firstName} ${user.lastName} hisobini va uning mashq urinishlarini butunlay o‘chirasizmi?`)) return;
    try {
      const response = await fetch(`/api/admin/users/${user._id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setUsers((items) => items.filter((item) => item._id !== user._id)); setTotal((count) => count - 1); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Hisobni o‘chirib bo‘lmadi."); }
  }

  return <section className="mt-12"><div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[11px] font-bold tracking-[1.3px] text-[#7770d2]">AKKAUNTLAR</p><h2 className="text-[23px] font-bold">Foydalanuvchilar <span className="text-sm font-semibold text-[#999aa8]">{total}</span></h2><p className="mt-1 text-[12px] text-[#8e8f9f]">Ball, bosqich va kirish holatini boshqaring; rag‘bat stikeri yuboring.</p></div><label className="flex h-10 min-w-60 items-center gap-2 rounded-xl border border-[#e5e6ed] bg-white px-3 text-[#999aa8]"><Search size={15}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ism yoki Gmail bo‘yicha qidirish" className="min-w-0 flex-1 bg-transparent text-xs text-[#343548] outline-none"/></label></div>
    {error && <p role="alert" className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>}
    {filteredUsers.length ? <div className="grid gap-4 lg:grid-cols-2">{filteredUsers.map((user) => <UserCard key={user._id} user={user} onUpdate={updateUser} onDelete={removeUser}/>)}</div> : <div className="rounded-2xl border border-dashed border-[#dedfe8] bg-white px-5 py-10 text-center text-sm text-[#9697a6]">{search ? "Qidiruv bo‘yicha user topilmadi." : "Hozircha user yo‘q."}</div>}
    {total > users.length && <p className="mt-4 text-center text-xs text-[#9293a2]">Birinchi {users.length} user ko‘rsatilmoqda.</p>}
  </section>;
}

function UserCard({ user, onUpdate, onDelete }: { user: ManagedUser; onUpdate: (user: ManagedUser, body: Record<string, string | number>) => Promise<void>; onDelete: (user: ManagedUser) => Promise<void> }) {
  const [score, setScore] = useState(String(user.totalScore));
  const [level, setLevel] = useState(String(user.currentLevel));
  const [sticker, setSticker] = useState<RewardStickerId>("great_job");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function act(body: Record<string, string | number>, success: string) {
    setBusy(true); setMessage("");
    try { await onUpdate(user, body); setScore(String(body.totalScore ?? user.totalScore)); setLevel(String(body.currentLevel ?? user.currentLevel)); setMessage(success); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Amal bajarilmadi."); }
    finally { setBusy(false); }
  }
  return <article className="rounded-2xl border border-[#e8e9f0] bg-white p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eeedff] text-xs font-bold text-[#635bdb]">{user.firstName.slice(0, 1)}{user.lastName.slice(0, 1)}</span><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold">{user.firstName} {user.lastName}</h3><p className="truncate text-[11px] text-[#858697]">{user.email}</p>{user.profileStatus && <p className="mt-1 truncate text-[10px] italic text-[#827acb]">“{user.profileStatus}”</p>}<p className="mt-1 text-[10px] text-[#a0a1ad]">{user.completedMissions} mashq · {user.totalAttempts} urinish · {user.totalErrors} xato</p></div><span className={`rounded-lg px-2 py-1 text-[10px] font-bold ${user.status === "active" ? "bg-[#eaf7f0] text-[#40976f]" : "bg-[#fff0ee] text-[#c36b60]"}`}>{user.status === "active" ? "Faol" : "To‘xtatilgan"}</span></div>
    <div className="my-4 grid grid-cols-2 gap-3"><label className="text-[10px] font-semibold text-[#858697]">Ball<input type="number" min="0" value={score} onChange={(event) => setScore(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-[#e7e7ee] px-2 text-xs text-[#343548]"/></label><label className="text-[10px] font-semibold text-[#858697]">Bosqich<select value={level} onChange={(event) => setLevel(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-[#e7e7ee] bg-white px-2 text-xs text-[#343548]"><option value="1">1 · Boshlang‘ich</option><option value="2">2 · O‘rta</option><option value="3">3 · Yuqori</option><option value="4">4 · Mukammal</option></select></label></div>
    <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => void act({ totalScore: Number(score), currentLevel: Number(level) }, "O‘zgarishlar saqlandi.")} className="flex-1 rounded-lg bg-[#635bdb] px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-50">Ball/bosqichni saqlash</button><button disabled={busy} onClick={() => void act({ status: user.status === "active" ? "suspended" : "active" }, user.status === "active" ? "Akkaunt to‘xtatildi." : "Akkaunt faollashtirildi.")} className="flex items-center gap-1.5 rounded-lg border border-[#e7e8ef] px-3 py-2 text-[11px] font-semibold text-[#666879] disabled:opacity-50">{user.status === "active" ? <><Ban size={13}/> To‘xtatish</> : <><ShieldCheck size={13}/> Faollashtirish</>}</button></div>
    <div className="mt-3 flex gap-2"><select aria-label="Rag‘bat stikeri" value={sticker} onChange={(event) => setSticker(event.target.value as RewardStickerId)} className="min-w-0 flex-1 rounded-lg border border-[#e7e8ef] bg-white px-2 text-[11px]">{Object.entries(rewardStickers).map(([id, reward]) => <option key={id} value={id}>{reward.emoji} {reward.label}</option>)}</select><button disabled={busy} onClick={() => void act({ sticker }, "Rag‘bat stikeri yuborildi.")} className="flex items-center gap-1.5 rounded-lg border border-[#e7e8ef] px-3 py-2 text-[11px] font-semibold text-[#666879] disabled:opacity-50"><Send size={13}/> Yuborish</button><button disabled={busy} aria-label="User hisobini o‘chirish" onClick={() => void onDelete(user)} className="rounded-lg border border-[#f0deda] p-2 text-[#bd655a] disabled:opacity-50"><Trash2 size={14}/></button></div>
    {message && <p role="status" className="mt-3 flex items-center gap-1.5 text-[10px] text-[#77798a]"><Check size={12} className="text-[#49a47b]"/>{message}</p>}
  </article>;
}

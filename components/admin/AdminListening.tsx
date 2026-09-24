"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import MissionEditor, { type EditableMission } from "@/components/admin/MissionEditor";

export default function AdminListening() {
  const [missions, setMissions] = useState<EditableMission[]>([]);
  const [editing, setEditing] = useState<EditableMission | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/missions").then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (active) setMissions(result.missions);
    }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Yuklab bo‘lmadi."); });
    return () => { active = false; };
  }, []);

  async function toggle(mission: EditableMission) {
    const response = await fetch(`/api/admin/missions/${mission._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !mission.published }) });
    if (!response.ok) { setError("Mashq holatini o‘zgartirib bo‘lmadi."); return; }
    setMissions((items) => items.map((item) => item._id === mission._id ? { ...item, published: !item.published } : item));
  }

  async function remove(mission: EditableMission) {
    if (!window.confirm(`“${mission.title}” mashqini o‘chirasizmi?`)) return;
    const response = await fetch(`/api/admin/missions/${mission._id}`, { method: "DELETE" });
    if (!response.ok) { setError("Mashqni o‘chirib bo‘lmadi."); return; }
    setMissions((items) => items.filter((item) => item._id !== mission._id));
    if (editing?._id === mission._id) setEditing(null);
  }

  function saved(mission: EditableMission) {
    setMissions((items) => items.some((item) => item._id === mission._id) ? items.map((item) => item._id === mission._id ? mission : item).sort((a, b) => a.level - b.level || a.order - b.order) : [...items, mission].sort((a, b) => a.level - b.level || a.order - b.order));
    setEditing(null); setError("");
  }

  return <div className="mt-7 grid gap-6 lg:grid-cols-[.95fr_1.05fr]">{error && <p role="alert" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 lg:col-span-2">{error}</p>}<MissionEditor key={editing?._id ?? "new-mission"} mission={editing} onSaved={saved} onCancel={() => setEditing(null)}/><section className="h-fit rounded-2xl border border-[#e8e9f0] bg-white p-5"><h2 className="mb-4 font-bold">Barcha mashqlar <span className="ml-1 text-xs font-medium text-[#9697a6]">{missions.length}</span></h2>{missions.length ? <ul className="divide-y divide-[#f0f0f4]">{missions.map((mission) => <li key={mission._id} className="flex items-center gap-2 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{mission.title}</p><p className="mt-1 text-[11px] text-[#9899a7]">{mission.level}-bosqich · {mission.difficulty} · {mission.segments?.length ?? 0} jumla · {mission.published ? "Nashr qilingan" : "Qoralama"}</p></div><button onClick={() => setEditing(mission)} aria-label={`${mission.title} ni tahrirlash`} className="rounded-lg border border-[#e7e8ef] p-2 text-[#635bdb]"><Pencil size={14}/></button><button onClick={() => void toggle(mission)} className="rounded-lg border border-[#e7e8ef] px-2 py-2 text-[10px] font-semibold text-[#666879]">{mission.published ? "Yashirish" : "Nashr qilish"}</button><button aria-label={`${mission.title} ni o‘chirish`} onClick={() => void remove(mission)} className="rounded-lg p-2 text-[#c87369] hover:bg-[#fff3f1]"><Trash2 size={15}/></button></li>)}</ul> : <p className="py-8 text-center text-sm text-[#999aa8]">Mashqlar topilmadi.</p>}</section></div>;
}

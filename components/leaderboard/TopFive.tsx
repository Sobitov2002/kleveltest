"use client";

import { useEffect, useState } from "react";
import { Crown, Trophy } from "lucide-react";

type Ranking = { rank: number; name: string; totalScore: number; completedMissions: number; currentLevel: number };

export default function TopFive() {
  const [users, setUsers] = useState<Ranking[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/leaderboard").then(async (response) => {
      const result = await response.json();
      if (active && response.ok) setUsers(result.users);
    }).catch(() => undefined).finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);

  return <section className="rounded-[20px] border border-[#e9eaf0] bg-white p-5"><div className="mb-4 flex items-center justify-between"><div><p className="mb-1 text-[10px] font-bold tracking-[1.2px] text-[#898a99]">ENG FAOL O‘RGANUVCHILAR</p><h2 className="text-[17px] font-bold">Top 5 reyting</h2></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff5df] text-[#d89b33]"><Trophy size={19}/></span></div>{users.length ? <ol className="grid gap-2">{users.map((user) => <li key={user.rank} className={`flex items-center gap-2.5 rounded-xl px-3 py-3 ${user.rank === 1 ? "bg-[#fff9ea]" : "bg-[#f8f9fc]"}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${user.rank === 1 ? "bg-[#f7e8ba] text-[#a67412]" : "bg-white text-[#77798a]"}`}>{user.rank === 1 ? <Crown size={15}/> : user.rank}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-bold">{user.name}</span><span className="block text-[9px] text-[#999aa8]">{user.completedMissions} mashq · {user.currentLevel}-bosqich</span></span><b className="text-[11px] text-[#635bdb]">{user.totalScore} P</b></li>)}</ol> : <p className="rounded-xl bg-[#f8f9fc] px-4 py-5 text-center text-xs text-[#999aa8]">{loaded ? "Reyting uchun hali natija yo‘q." : "Reyting yuklanmoqda…"}</p>}</section>;
}

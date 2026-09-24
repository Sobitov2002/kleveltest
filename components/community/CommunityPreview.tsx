"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Users } from "lucide-react";

type Member = { id: string; name: string; profileStatus: string };
export default function CommunityPreview() {
  const [members, setMembers] = useState<Member[]>([]);
  useEffect(() => { let active = true; fetch("/api/users").then((response) => response.json()).then((data) => { if (active) setMembers((data.users ?? []).slice(0, 4)); }).catch(() => undefined); return () => { active = false; }; }, []);
  return <section className="mt-5 rounded-[20px] border border-[#e9eaf0] bg-white p-5"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eeedff] text-[#635bdb]"><Users size={17}/></span><div><h2 className="text-sm font-bold">Jamoa</h2><p className="text-[10px] text-[#9697a5]">Holatlar va yozishmalar</p></div></div><div className="mt-3 divide-y divide-[#f1f1f5]">{members.length ? members.map((member) => <div key={member.id} className="py-2.5"><p className="truncate text-[11px] font-semibold">{member.name}</p><p className="mt-0.5 line-clamp-1 text-[10px] text-[#8b8d9a]">{member.profileStatus || "Koreys tilini o‘rganyapman"}</p></div>) : <p className="py-4 text-center text-[10px] text-[#999aa8]">Holatlar yuklanmoqda…</p>}</div><Link href="/community" className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#f4f3ff] px-3 py-2.5 text-[11px] font-semibold text-[#635bdb]"><MessageCircle size={14}/> Yozishmalar va jamoa</Link></section>;
}

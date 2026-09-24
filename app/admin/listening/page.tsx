import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Headphones } from "lucide-react";
import { isAdminSession } from "@/lib/admin";
import AdminListening from "@/components/admin/AdminListening";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminActivity from "@/components/admin/AdminActivity";
import TopFive from "@/components/leaderboard/TopFive";

export default async function AdminListeningPage() {
  if (!await isAdminSession()) redirect("/?admin=required");
  return <main className="min-h-screen bg-[#f8f9fc] px-5 pb-12 text-[#1e2030]"><header className="mx-auto flex h-[72px] max-w-5xl items-center justify-between"><Link href="/" className="flex items-center gap-2 text-[13px] font-semibold text-[#737587]"><ArrowLeft size={16}/> Saytga qaytish</Link><span className="flex items-center gap-2 font-bold"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#635bdb] text-white"><Headphones size={17}/></span>kleveltest <small className="text-[9px] font-medium text-[#858697]">by dinakorean</small><span className="rounded-md bg-[#f0efff] px-2 py-1 text-[10px] font-bold text-[#635bdb]">ADMIN</span></span></header><section className="mx-auto max-w-5xl pt-8"><p className="mb-2 text-[11px] font-bold tracking-[1.3px] text-[#7770d2]">BOSHQARUV</p><h1 className="text-[28px] font-bold tracking-[-.8px]">Listening mashqlari</h1><p className="mt-2 text-[13px] text-[#898a99]">Mashqlarni yarating va nashr holatini boshqaring.</p><div className="mt-8"><TopFive/></div><AdminListening/><AdminUsers/><AdminActivity/></section></main>;
}

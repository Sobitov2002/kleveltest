import { ArrowUpRight, Camera, CirclePlay, Send } from "lucide-react";

const socials = [
  { label: "Instagram", href: "https://www.youtube.com/redirect?event=channel_description&redir_token=QUZZTVljR2tLczQ5WDZDeUpueUlvY3BJZmFaZXxBTl9pYzRjTUZ3d2ZVOUVaaktoWFBWVkdnSTUxQ1FRbkFBRDh1dWUxc0lPTE9taVFMQVlsU21QT0FzR2NOVjZPN3dQQlNYSDZObnoyQlJsRUpYR3ctTloyV0N5VFg0M2tHUmFZ&q=https%3A%2F%2Fwww.instagram.com%2Fdinakoreanvlog%3Figsh%3DcjlmNWprazFjampt%26utm_source%3Dqr", icon: Camera },
  { label: "YouTube", href: "https://youtube.com/@dinakorean?si=HSd3-BSnke_UB-az", icon: CirclePlay },
  { label: "Telegram", href: "https://t.me/dinakorean", icon: Send },
];

export function SocialIcons({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-2">{socials.map(({ label, href, icon: Icon }) => { const className = `grid place-items-center rounded-xl border border-[#e8e9f0] bg-white text-[#5e5f70] transition hover:border-[#d6d3fb] hover:bg-[#f5f4ff] hover:text-[#635bdb] ${compact ? "h-8 w-8" : "h-10 w-10"}`; return href ? <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} className={className}><Icon size={compact ? 15 : 17}/></a> : <button key={label} type="button" disabled aria-label={`${label} havolasini qo‘shish kerak`} title={`${label} havolasini keyin qo‘shing`} className={`${className} cursor-default opacity-60`}><Icon size={compact ? 15 : 17}/></button>; })}</div>;
}

export default function SocialPromo() {
  return <section className="mt-5 overflow-hidden rounded-[20px] border border-[#e7e4fb] bg-[linear-gradient(135deg,#f2f0ff,#fff)] p-5"><p className="text-[10px] font-bold tracking-[1.2px] text-[#7770d2]">HAMKOR VA TA’LIM LOYIHASI</p><h2 className="mt-1 text-sm font-bold">Dinakorean bilan rivojlaning</h2><p className="mt-1 text-[11px] leading-5 text-[#858697]">Koreys tili darslari, yangiliklar va foydali videolar.</p><div className="mt-3 flex items-center justify-between"><SocialIcons compact/><a href="https://dinakorean.uz" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] font-semibold text-[#635bdb]">Dinakorean.uz <ArrowUpRight size={13}/></a></div><a href="https://upper.uz" target="_blank" rel="noreferrer" className="mt-3 block border-t border-[#e8e5f7] pt-3 text-[10px] font-medium text-[#77798a]">Hamkor loyiha: <span className="font-bold text-[#55576a]">Upper.uz</span></a></section>;
}

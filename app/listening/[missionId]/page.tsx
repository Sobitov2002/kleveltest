"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CirclePause, CirclePlay, Clock3, Headphones, RotateCcw } from "lucide-react";
import { normalizeAnswer } from "@/lib/listening/normalizeAnswer";
import MissionDiscussion from "@/components/listening/MissionDiscussion";

type Segment = { _id?: string; order: number; startTime: number; endTime: number; text: string; points: number };
type Mission = { _id: string; title: string; description: string; level: number; difficulty: string; totalPoints: number; video?: { url?: string; duration?: number }; segments: Segment[] };
type Props = { params: Promise<{ missionId: string }> };

export default function MissionPage({ params }: Props) {
  const [missionId, setMissionId] = useState("");
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | "">("");
  const [saveMessage, setSaveMessage] = useState("");
  const [seconds, setSeconds] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [done, setDone] = useState(false);
  const [ownUserId, setOwnUserId] = useState("");
  const [mastered, setMastered] = useState(false);
  const [nextMissionId, setNextMissionId] = useState("");

  useEffect(() => { params.then(({ missionId: id }) => setMissionId(id)); }, [params]);
  useEffect(() => {
    if (!missionId) return;
    void Promise.all([fetch("/api/auth/session").then((response) => response.json()), fetch("/api/missions").then((response) => response.json()), fetch("/api/user/progress").then((response) => response.json())]).then(([session, missionData, progress]) => {
      setOwnUserId(session.user?._id ?? session.user?.id ?? "");
      const list = [...(missionData.missions ?? [])].sort((a, b) => a.level - b.level || a.order - b.order);
      const index = list.findIndex((item) => item._id === missionId);
      if (index >= 0 && list[index + 1]) setNextMissionId(list[index + 1]._id);
      const percent = progress.mastery?.[missionId] ?? 0;
      if (percent >= 90) setMastered(true);
    }).catch(() => undefined);
  }, [missionId]);
  useEffect(() => {
    if (!missionId) return;
    fetch(`/api/missions/${missionId}`).then(async (res) => { const result = await res.json(); if (!res.ok) throw new Error(result.error); setMission(result.mission); })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Mashqni ochib bo‘lmadi."))
      .finally(() => setLoading(false));
  }, [missionId]);
  useEffect(() => { if (!started || done) return; const timer = window.setInterval(() => setSeconds((n) => n + 1), 1000); return () => window.clearInterval(timer); }, [started, done]);
  useEffect(() => {
    if (countdown === null) return;
    const timer = window.setTimeout(() => {
      if (countdown > 1) setCountdown(countdown - 1);
      else {
        setCountdown(null);
        setStarted(true);
        if (mission?.video?.url) setPlaying(true);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, mission?.video?.url]);

  const segment = mission?.segments[index];
  useEffect(() => {
    const player = videoRef.current;
    if (!player || !segment || !started || !playing) return;
    if (player.currentTime < segment.startTime || player.currentTime >= segment.endTime) player.currentTime = segment.startTime;
    const tick = () => { if (player.currentTime >= segment.endTime) { player.pause(); setPlaying(false); } };
    player.addEventListener("timeupdate", tick);
    void player.play().catch(() => setPlaying(false));
    return () => { player.removeEventListener("timeupdate", tick); player.pause(); };
  }, [index, playing, segment, started]);

  function begin() { if (!mission || countdown !== null) return; setCountdown(3); }
  function validate(value: string) {
    setAnswer(value);
    if (feedback === "wrong") setFeedback("");
    if (!segment || done || !value.trim() || feedback === "correct") return;
    if (normalizeAnswer(value) === normalizeAnswer(segment.text)) {
      videoRef.current?.pause(); setPlaying(false);
      setAttempts((n) => n + 1); setScore((n) => n + segment.points); setFeedback("correct");
      window.setTimeout(() => { setAnswer(""); setFeedback(""); if (index + 1 >= (mission?.segments.length ?? 0)) { videoRef.current?.pause(); setDone(true); setStarted(false); setPlaying(false); void saveResult(mission?.segments.length ?? 0, true); } else { setIndex((n) => n + 1); setPlaying(Boolean(mission?.video?.url)); } }, 650);
    }
  }
  function checkAnswer() {
    if (!segment || done || !answer.trim() || feedback === "correct") return;
    if (normalizeAnswer(answer) === normalizeAnswer(segment.text)) { validate(answer); return; }
    videoRef.current?.pause(); setPlaying(false);
    setFeedback("wrong"); setAttempts((n) => n + 1); setErrors((n) => n + 1);
  }
  async function saveResult(completedSegments: number, justAnswered = false) {
    if (!mission) return;
    try {
      const response = await fetch("/api/attempts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ missionId: mission._id, attempts: attempts + Number(justAnswered), errors, completedSegments, elapsedSeconds: seconds }) });
      if (!response.ok) { const result = await response.json(); setSaveMessage(result.error ?? "Natijani saqlab bo‘lmadi."); }
      else { const result = await response.json(); setMastered(result.attempt.masteryPercent >= 90); setSaveMessage(result.attempt.masteryPercent >= 90 ? "Mashq 90% o‘zlashtirildi. Keyingi mashq ochildi va matn profilingizda mavjud." : `Natija saqlandi: ${result.attempt.masteryPercent}%. Keyingi mashqni ochish uchun 90% kerak.`); }
    } catch { setSaveMessage("Natijani saqlab bo‘lmadi. Internetni tekshirib qayta urinib ko‘ring."); }
  }
  function finishMission() { if (feedback === "correct") return; videoRef.current?.pause(); setDone(true); setStarted(false); setPlaying(false); void saveResult(index); }
  function reset() { const player = videoRef.current; player?.pause(); if (player) player.currentTime = mission?.segments[0]?.startTime ?? 0; setIndex(0); setAnswer(""); setStarted(false); setCountdown(null); setPlaying(false); setAttempts(0); setErrors(0); setScore(0); setSeconds(0); setFeedback(""); setSaveMessage(""); setDone(false); }
  const format = (value: number) => `${Math.floor(value / 60).toString().padStart(2, "0")}:${(value % 60).toString().padStart(2, "0")}`;

  if (loading) return <main className="min-h-screen bg-[#f8f9fc] p-8"><div className="mx-auto h-48 max-w-4xl animate-pulse rounded-3xl bg-white"/></main>;
  if (error || !mission) return <main className="grid min-h-screen place-items-center bg-[#f8f9fc] px-5"><div className="rounded-2xl border border-[#e8e9f0] bg-white p-8 text-center"><Headphones className="mx-auto mb-4 text-[#635bdb]"/><h1 className="font-bold">{error || "Mashq topilmadi."}</h1><Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#635bdb]" href="/"> <ArrowLeft size={16}/> Bosh sahifaga</Link></div></main>;
  return <main className="min-h-screen bg-[#f8f9fc] px-4 pb-12 text-[#1e2030] sm:px-6"><header className="mx-auto flex h-[70px] max-w-5xl items-center justify-between"><Link href="/" className="flex items-center gap-2 text-[13px] font-semibold text-[#77798a]"><ArrowLeft size={17}/> Mashqlarga qaytish</Link><Link href="/" className="flex items-center gap-2 font-bold"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#635bdb] text-white"><Headphones size={17}/></span>kleveltest<small className="ml-1 text-[9px] font-medium text-[#858697]">by dinakorean</small></Link><div className="flex items-center gap-2 rounded-xl border border-[#e8e9ef] bg-white px-3 py-2 text-[12px] font-semibold"><Clock3 size={15} className="text-[#635bdb]"/>{format(seconds)}</div></header>
    <div className="mx-auto max-w-5xl pt-3"><div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-[11px] font-bold tracking-[1.2px] text-[#7770d2]">{mission.level}-BOSQICH <span className="text-[#cbcbd4]">·</span> {mission.difficulty.toUpperCase()}</div><h1 className="text-[24px] font-bold tracking-[-.7px] sm:text-[29px]">{mission.title}</h1><p className="mt-1 text-[13px] text-[#8b8d9c]">{mission.description}</p></div><div className="flex gap-2 text-[11px]"><div className="rounded-xl border border-[#e9eaf0] bg-white px-3 py-2"><span className="text-[#9798a7]">Urinishlar</span><b className="ml-2">{attempts}</b></div><div className="rounded-xl border border-[#e9eaf0] bg-white px-3 py-2"><span className="text-[#9798a7]">Xato</span><b className="ml-2 text-[#db7568]">{errors}</b></div><div className="rounded-xl border border-[#e9eaf0] bg-white px-3 py-2"><span className="text-[#9798a7]">Ball</span><b className="ml-2 text-[#635bdb]">{score} P</b></div></div></div>
      <div className="overflow-hidden rounded-[22px] border border-[#e7e8ef] bg-white shadow-[0_12px_40px_#38386b08]"><div className="relative aspect-video bg-[#171723]">{mission.video?.url ? <video ref={videoRef} src={mission.video.url} className="h-full w-full object-contain" playsInline controls={false} onEnded={() => setPlaying(false)}/> : <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_center,#35334f_0%,#1b1b29_75%)]"><div className="text-center"><span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-white"><Headphones size={25}/></span><p className="text-[14px] font-semibold text-white">Video hali yuklanmagan</p><p className="mt-1 text-[11px] text-white/50">Mashq ma’lumotlari baribir mavjud</p></div></div>}{countdown !== null && <div className="absolute inset-0 z-10 grid place-content-center bg-[#151522]/80 text-center text-white backdrop-blur-sm" aria-live="assertive"><span key={countdown} className="animate-pulse text-[120px] font-black leading-none tracking-[-8px] sm:text-[180px]">{countdown}</span><span className="mt-4 text-sm font-semibold tracking-wide text-white/80">Tayyorlaning…</span></div>}</div>
        <div className="p-5 sm:p-7"><div className="mb-5 flex items-center justify-between"><span className="text-[12px] font-semibold">Jumla <b className="text-[#635bdb]">{done ? mission.segments.length : Math.min(index + 1, mission.segments.length)}</b> / {mission.segments.length}</span><span className="text-[12px] font-semibold text-[#7e8090]">{score} <span className="text-[#aaaab5]">/ {mission.totalPoints} ball</span></span></div><div className="mb-7 h-2 overflow-hidden rounded-full bg-[#efeff5]"><div className="h-full rounded-full bg-[#7068dc] transition-all" style={{ width: `${mission.segments.length ? (done ? 100 : index / mission.segments.length * 100) : 0}%` }}/></div>
          {done ? <div className="rounded-2xl border border-[#dcefe4] bg-[#f1faf5] p-5 text-center sm:p-6"><span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-[#dff3e8] text-[#41a477]"><Check/></span><h2 className="text-[19px] font-bold">Mashq yakunlandi</h2><p className="mt-1 text-[13px] text-[#7e8b84]">Natijangiz: {score} ball · {format(seconds)}</p><p role="status" className="mt-2 text-[11px] text-[#858b89]">{saveMessage || "Natija saqlanmoqda…"}</p><MissionDiscussion missionId={mission._id} ownUserId={ownUserId}/><div className="mt-4 flex flex-wrap justify-center gap-2"><button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-[#e0e0ea] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#595b6d]"><RotateCcw size={14}/> Qayta ishlash</button>{mastered && nextMissionId ? <Link href={`/listening/${nextMissionId}`} className="inline-flex items-center gap-2 rounded-xl bg-[#635bdb] px-4 py-2.5 text-[12px] font-semibold text-white">Keyingi mashq <ArrowRight size={14}/></Link> : !mastered ? <span className="self-center text-[10px] text-[#8a8b99]">Keyingi mashq uchun 90% o‘zlashtiring.</span> : <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-[#635bdb] px-4 py-2.5 text-[12px] font-semibold text-white">Mashqlar ro‘yxati <ArrowRight size={14}/></Link>}</div></div> : !mission.segments.length ? <div className="rounded-xl bg-[#f7f7fa] p-6 text-center text-[13px] text-[#88899a]">Bu mashq uchun jumlalar hali kiritilmagan.</div> : <><div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><label htmlFor="answer" className="text-[13px] font-semibold">들은 문장을 한국어로 입력하세요</label><span className="text-[11px] text-[#a1a2af]">Eshitgan jumlangizni koreyscha yozing</span></div><textarea id="answer" autoFocus={started} inputMode="text" autoCapitalize="off" spellCheck={false} disabled={!started || done} value={answer} onChange={(event) => validate(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); checkAnswer(); } }} placeholder={started ? "Koreyscha jumlani shu yerga yozing…" : countdown !== null ? "Mashq boshlanmoqda…" : "Boshlash tugmasini bosing"} className={`min-h-36 w-full resize-y rounded-xl border bg-[#fcfcfe] p-4 text-[18px] leading-7 outline-none transition placeholder:text-[13px] placeholder:text-[#b0b1bc] focus:border-[#8c85e8] focus:ring-4 focus:ring-[#635bdb12] sm:min-h-28 ${feedback === "correct" ? "border-[#64bd91] bg-[#f4fbf7]" : feedback === "wrong" ? "border-[#e58b81] bg-[#fff8f7]" : "border-[#e5e6ee]"}`}/><div className="mt-3 flex min-h-6 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><span className={`text-[12px] font-medium ${feedback === "correct" ? "text-[#369568]" : feedback === "wrong" ? "text-[#d26b60]" : "text-[#a1a2af]"}`}>{feedback === "correct" ? "To‘g‘ri! Keyingi jumla…" : feedback === "wrong" ? "Xato. Jumla mos kelmadi, qayta urinib ko‘ring." : started ? "Jumla mos kelishi bilan avtomatik tekshiriladi" : ""}</span>{started && <button type="button" onClick={checkAnswer} disabled={!answer.trim() || feedback === "correct"} className="w-fit rounded-lg bg-[#fff0ee] px-3 py-1.5 text-[11px] font-semibold text-[#c6564d] disabled:opacity-40">Javobni tekshirish</button>}<span className="text-[11px] text-[#a1a2af]">Enter bilan tekshirish mumkin</span></div><div className="mt-5 flex flex-col items-center justify-center gap-3 border-t border-[#f0f0f4] pt-5 sm:flex-row sm:justify-between">{!started ? <button onClick={begin} disabled={!mission.segments.length || countdown !== null} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#635bdb] px-8 text-[17px] font-bold text-white shadow-[0_6px_18px_#635bdb40] transition hover:bg-[#554dc7] disabled:opacity-60 sm:w-auto">{countdown !== null ? "Tayyorlaning…" : <><CirclePlay size={20}/> Boshlash</>}</button> : <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><button onClick={() => setPlaying((current) => !current)} disabled={!mission.video?.url} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e6e6ef] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#5e6072] disabled:opacity-45">{playing ? <CirclePause size={16}/> : <CirclePlay size={16}/>} {playing ? "Pauza" : "Qayta tinglash"}</button><button onClick={finishMission} disabled={feedback === "correct"} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#635bdb] px-5 py-2.5 text-[12px] font-semibold text-white disabled:opacity-50"><Check size={15}/> Mashqni yakunlash</button></div>}<div className="text-[11px] text-[#9a9baa]">{mission.segments.length - (done ? mission.segments.length : index)} ta jumla qoldi</div></div></>}
        </div></div><p className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#a1a2af]"><Check size={13} className="text-[#55ad83]"/> Javoblar tinish belgilarisiz ham tekshiriladi.</p></div>
  </main>;
}

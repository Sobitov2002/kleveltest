import { connectToDatabase } from "../lib/mongodb";
import { Level } from "../models/Level";
import { Mission } from "../models/Mission";

async function seed() {
  await connectToDatabase();
  const levels = ["Boshlang‘ich", "O‘rta", "Yuqori", "Mukammal"];
  for (const [index, title] of levels.entries()) await Level.updateOne({ number: index + 1 }, { $set: { title, order: index + 1, published: true } }, { upsert: true });
  const demoMissions = [
    { title: "Koreyscha salomlashuv", description: "Salomlashish va tanishish iboralari.", level: 1, difficulty: "Oson", order: 1, video: { provider: "external", url: "", duration: 18 }, segments: [{ order: 1, startTime: 0, endTime: 4, text: "안녕하세요.", points: 100 }, { order: 2, startTime: 4, endTime: 8, text: "저는 아부바키르입니다.", points: 120 }, { order: 3, startTime: 8, endTime: 13, text: "한국어를 공부하고 있습니다.", points: 130 }, { order: 4, startTime: 13, endTime: 18, text: "만나서 반갑습니다.", points: 150 }], fullTranscript: "안녕하세요.\n저는 아부바키르입니다.\n한국어를 공부하고 있습니다.\n만나서 반갑습니다.", totalPoints: 500, published: true },
    ...Array.from({ length: 5 }, (_, index) => {
      const texts = [["커피 한 잔 주세요.", "아이스로 주세요."], ["오늘은 날씨가 좋아요.", "공원에 산책하러 가요."], ["친구를 만나서 이야기해요.", "같이 점심을 먹어요."], ["지하철역이 어디예요?", "저쪽으로 가면 돼요."], ["주말에 영화를 봤어요.", "정말 재미있었어요."]][index];
      const segments = texts.map((text, segmentIndex) => ({ order: segmentIndex + 1, startTime: segmentIndex * 4, endTime: (segmentIndex + 1) * 4, text, points: 100 }));
      return { title: ["Kafeda buyurtma", "Kundalik reja", "Do‘st bilan suhbat", "Yo‘l so‘rash", "Dam olish kuni"][index], description: "Tinglang va eshitgan jumlangizni koreyscha yozing.", level: index < 3 ? 1 : 2, difficulty: index < 3 ? "Oson" : "O‘rta", order: index + 2, video: { provider: "external", url: "", duration: 8 }, segments, fullTranscript: texts.join("\n"), totalPoints: 200, published: true };
    }),
  ];
  for (const mission of demoMissions) await Mission.updateOne({ level: mission.level, order: mission.order }, { $set: mission }, { upsert: true });
  console.log(`Seed complete: ${levels.length} levels and ${demoMissions.length} missions.`);
  await process.exit(0);
}
seed().catch((error: unknown) => { console.error(error); process.exit(1); });

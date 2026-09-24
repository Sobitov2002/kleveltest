import { ListeningAttempt } from "@/models/ListeningAttempt";
import { Mission } from "@/models/Mission";

export async function getUserMastery(userId: string) {
  const attempts = await ListeningAttempt.find({ userId, status: "completed" }).select("missionId completedSegments").lean();
  const bestProgress = new Map<string, number>();
  for (const attempt of attempts) {
    const id = String(attempt.missionId);
    bestProgress.set(id, Math.max(bestProgress.get(id) ?? 0, attempt.completedSegments));
  }
  const missions = await Mission.find({ _id: { $in: [...bestProgress.keys()] }, published: true }).select("segments").lean();
  const mastery = new Map<string, number>();
  for (const mission of missions) {
    const id = String(mission._id);
    const total = mission.segments.length;
    mastery.set(id, total ? Math.floor(((bestProgress.get(id) ?? 0) / total) * 100) : 0);
  }
  return mastery;
}

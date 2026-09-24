export const rewardStickers = {
  great_job: { emoji: "🌟", label: "Ajoyib!", message: "Zo‘r natija! Shu tempda davom eting." },
  keep_going: { emoji: "💪", label: "Davom et!", message: "Har bir urinish sizni maqsadga yaqinlashtiradi." },
  korean_star: { emoji: "🇰🇷", label: "Koreys tili yulduzi", message: "Koreys tilida ajoyib o‘sish ko‘rsatyapsiz!" },
  perfect_focus: { emoji: "🎯", label: "Diqqat chempioni", message: "Diqqatingiz va mehnatingiz tahsinga loyiq." },
} as const;

export type RewardStickerId = keyof typeof rewardStickers;

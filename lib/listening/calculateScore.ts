export function calculateScore(points: number, errors: number): number {
  return Math.max(0, Math.round(points * Math.max(0.5, 1 - errors * 0.1)));
}

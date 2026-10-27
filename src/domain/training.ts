export interface TrainingRecord {
  status: string; type: string; accuracy: number; itemsCompleted: number;
  finishedAt: string; category?: string; difficultyLevel?: number;
}
export const MAX_MEMORY_LEVEL = 3;
export const SESSIONS_TO_ADVANCE = 2;
export function memoryProgress(history: TrainingRecord[]) {
  let level = 1, successes = 0;
  for (const r of [...history].reverse()) {
    if (r.type !== "TRAINING" || r.status !== "COMPLETED" || r.category !== "MEMORIA" || r.difficultyLevel !== level) continue;
    if (r.itemsCompleted >= 3 && r.accuracy >= .8) successes++;
    else successes = 0;
    if (successes >= SESSIONS_TO_ADVANCE && level < MAX_MEMORY_LEVEL) { level++; successes = 0; }
  }
  return { level, successes: Math.min(successes, SESSIONS_TO_ADVANCE), objects: level + 3 };
}
export function localDay(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year:"numeric", month:"2-digit", day:"2-digit" }).format(date);
}
export function streakDays(history: TrainingRecord[], now = new Date()) {
  const days = new Set(history.filter(r => r.status === "COMPLETED").map(r => localDay(new Date(r.finishedAt))));
  const cursor = new Date(`${localDay(now)}T12:00:00Z`);
  if (!days.has(localDay(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let count = 0;
  while (days.has(localDay(cursor))) { count++; cursor.setUTCDate(cursor.getUTCDate() - 1); }
  return count;
}

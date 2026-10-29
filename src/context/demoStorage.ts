import type { DemoResult } from "./JourneyContext";
export type AssessmentStatus = "pending" | "skipped" | "completed";
export interface DemoProfile {
  username: string;
  ageRange: string;
  minutes: number;
  goals: string[];
  configured: boolean;
  assessmentStatus: AssessmentStatus;
  assessmentRequired: boolean;
  history: DemoResult[];
}
const PROFILES = "mentia_demo_profiles_v1";
const ACTIVE = "mentia_demo_active_v1";
function profiles(): Record<string, unknown> {
  try { const value = JSON.parse(localStorage.getItem(PROFILES) || "{}"); return value && typeof value === "object" && !Array.isArray(value) ? value : {}; } catch { return {}; }
}
function validResult(r: unknown): r is DemoResult {
  if (!r || typeof r !== "object") return false;
  const v = r as DemoResult;
  return typeof v.id === "string" && ["INITIAL_ASSESSMENT","TRAINING"].includes(v.type) && ["COMPLETED","ABANDONED"].includes(v.status)
    && typeof v.finishedAt === "string" && Number.isFinite(Date.parse(v.finishedAt))
    && [v.accuracy,v.correctCount,v.itemsCompleted,v.totalTimeMs,v.xpEarned,v.difficultyLevel].every(Number.isFinite)
    && v.accuracy >= 0 && v.accuracy <= 1 && v.itemsCompleted >= 0 && v.itemsCompleted <= 3
    && v.correctCount >= 0 && v.correctCount <= v.itemsCompleted && v.totalTimeMs >= 0 && v.xpEarned >= 0
    && [1,2,3].includes(v.difficultyLevel) && v.category === "MEMORIA";
}
export function loadDemoProfile(alias: string): DemoProfile | null {
  const all = profiles();
  if (!Object.hasOwn(all, alias)) return null;
  const p = all[alias] as DemoProfile;
  if (!p || p.username !== alias || typeof p.ageRange !== "string" || typeof p.configured !== "boolean"
    || typeof p.assessmentRequired !== "boolean" || ![5,10,15,20,25,30].includes(p.minutes)
    || !["pending","skipped","completed"].includes(p.assessmentStatus)
    || !Array.isArray(p.goals) || !p.goals.every(g => ["MEMORIA","ATENCION","MEMORIA_TRABAJO"].includes(g))
    || !Array.isArray(p.history) || !p.history.every(validResult)) return null;
  return p;
}
export function restoreDemoSession(): DemoProfile | null {
  try { return loadDemoProfile(localStorage.getItem(ACTIVE) || ""); } catch { return null; }
}
export function saveDemoProfile(profile: DemoProfile) {
  try {
    localStorage.setItem(PROFILES, JSON.stringify({ ...profiles(), [profile.username]: profile }));
    localStorage.setItem(ACTIVE, profile.username);
    return true;
  } catch { return false; }
}
export function endDemoSession() { try { localStorage.removeItem(ACTIVE); } catch { /* No credentials stored. */ } }

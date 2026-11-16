/**
 * Cliente de MentIA-api según su contrato (openapi.yaml del backend).
 * Los errores llegan como ProblemDetail con un `code` estable; ApiError los expone tal cual.
 */
const baseUrl = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public errors: { field: string; message: string }[] = [],
  ) {
    super(message);
  }
}

/** Se invoca ante un 401 en una request autenticada (token vencido o revocado). */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "No pudimos conectarnos con MentIA. Revisá tu conexión e intentá de nuevo.");
  }
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}));
    if (response.status === 401 && token) onUnauthorized?.();
    throw new ApiError(
      response.status,
      problem.code || "HTTP_ERROR",
      problem.errors?.[0]?.message || problem.detail || problem.title || "No pudimos completar la solicitud.",
      problem.errors || [],
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

// ---- Tipos del contrato ----

export type AgeRange = "18-24" | "25-30" | "31-40" | "41+";
export type Role = "USER" | "ADMIN";
export type SessionType = "INITIAL_ASSESSMENT" | "TRAINING";
export type SessionStatus = "GENERATED" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
export type ExerciseType =
  | "VISUAL_RECOGNITION"
  | "SPATIAL_GRID"
  | "ODD_ONE_OUT"
  | "STROOP"
  | "REVERSE_SEQUENCE"
  | "N_BACK"
  | "AUDITORY_SEQUENCE";

export interface TokenResponse { accessToken: string; tokenType: string; expiresIn: number; role: Role }
export interface Profile {
  ageRange: AgeRange;
  educationLevel?: string | null;
  sessionMinutes: number;
  goals: string[];
  onboardingCompleted: boolean;
  assessmentCompleted: boolean;
}
export interface ProfileUpdate {
  ageRange?: AgeRange;
  sessionMinutes?: number;
  goals?: string[];
  onboardingCompleted?: boolean;
}
export interface Category { code: string; name: string; description?: string; mvp: boolean }
export interface PerformanceProfile {
  /** `progress`: puntos dentro del nivel, de 0 (piso) a 100 (techo). */
  categories: { category: string; score: number; level: number; progress: number; updatedAt?: string }[];
}
export interface SessionItem {
  sessionItemId: string;
  position: number;
  exerciseCode: string;
  exerciseType: ExerciseType;
  category: string;
  modality: "VISUAL" | "AUDITORY";
  difficultyLevel: number;
  variantKey: string;
  seed: number;
  params: Record<string, unknown>;
  content: Record<string, unknown>;
  instructions: string;
}
export interface RationaleEntry { code: string; category?: string | null; message: string }
export interface Session {
  id: string;
  type: SessionType;
  status: SessionStatus;
  plannedMinutes: number;
  estimatedDurationSeconds: number;
  items: SessionItem[];
  rationale?: RationaleEntry[];
  createdAt: string;
}
export interface AttemptRequest {
  clientAttemptId: string;
  sessionItemId: string;
  response?: Record<string, unknown>;
  isCorrect: boolean;
  accuracy: number;
  responseTimeMs: number;
  metrics?: Record<string, unknown>;
}
export interface CategoryResult {
  category: string;
  itemsCompleted: number;
  accuracy: number;
  avgResponseTimeMs?: number | null;
  difficultyLevelBefore: number;
  difficultyLevelAfter: number;
  /** Puntos dentro del nivel antes y después (0 a 100). En la evaluación inicial no hay "antes". */
  levelProgressBefore?: number | null;
  levelProgressAfter?: number | null;
}
export interface SessionResult {
  sessionId: string;
  type: SessionType;
  status: SessionStatus;
  itemsTotal: number;
  itemsCompleted: number;
  correctCount: number;
  errorCount: number;
  accuracy: number;
  totalTimeMs: number;
  categories: CategoryResult[];
  adaptations: { category: string; from: number; to: number; direction: "UP" | "KEEP" | "DOWN" }[];
  comparison?: { previousAccuracy: number; accuracyDelta: number } | null;
  gamification?: {
    xpEarned: number;
    xpTotal: number;
    level: number;
    leveledUp: boolean;
    unlockedAchievements: { code: string; name: string }[];
  } | null;
}
export interface SessionSummary {
  id: string;
  type: SessionType;
  status: SessionStatus;
  finishedAt?: string | null;
  accuracy?: number | null;
  itemsCompleted: number;
  totalTimeMs: number;
}
export interface SessionHistoryPage { items: SessionSummary[]; page: number; size: number; totalElements: number }
export interface GamificationState { xp: number; level: number; xpIntoLevel: number; xpForNextLevel: number }
export interface ProgressSummary {
  sessionsCompleted: number;
  sessionsAbandoned: number;
  activeDaysLast30: number;
  lastSessionAt?: string | null;
  currentStreakDays?: number | null;
  dailyGoal?: { target: number; completedToday: number } | null;
  gamification?: GamificationState;
}
export interface CategoryProgress {
  category: string;
  points: { periodStart: string; accuracy: number; avgDifficultyLevel: number; sessions: number }[];
}
export interface Achievement { code: string; name: string; description: string; unlocked: boolean; unlockedAt?: string | null }
export interface ConsistencyGroup {
  label: string;
  minActiveDays: number;
  maxActiveDays?: number | null;
  users: number;
  sessionsCompleted: number;
  sessionsAbandoned: number;
  avgSessionsPerUser?: number | null;
  abandonRate?: number | null;
  usersWithTrend: number;
  avgFirstAccuracy?: number | null;
  avgLastAccuracy?: number | null;
  avgAccuracyDelta?: number | null;
  avgLevelDelta?: number | null;
  categories: { category: string; users: number; avgLevelDelta: number }[];
}
export interface ConsistencyReport {
  generatedAt: string;
  timeZone: string;
  totals: { users: number; usersWithStartingPoint: number; usersWithTraining: number; sessionsCompleted: number; sessionsAbandoned: number; abandonRate?: number | null };
  groups: ConsistencyGroup[];
}

// ---- Operaciones ----

const json = (body: unknown) => JSON.stringify(body);

export const mentiaApi = {
  register: (username: string, password: string, ageRange: AgeRange) =>
    apiRequest<{ userId: string; recoveryCode: string | null }>("/auth/register", {
      method: "POST",
      body: json({ username, password, ageRange }),
    }),
  login: (username: string, password: string) =>
    apiRequest<TokenResponse>("/auth/login", { method: "POST", body: json({ username, password }) }),
  logout: (token: string) => apiRequest<void>("/auth/logout", { method: "POST" }, token),
  resetPassword: (username: string, recoveryCode: string, newPassword: string) =>
    apiRequest<{ recoveryCode: string }>("/auth/recovery/reset", {
      method: "POST",
      body: json({ username, recoveryCode, newPassword }),
    }),
  regenerateRecoveryCode: (token: string, password: string) =>
    apiRequest<{ recoveryCode: string }>("/auth/recovery/regenerate", { method: "POST", body: json({ password }) }, token),

  profile: (token: string) => apiRequest<Profile>("/profile", {}, token),
  updateProfile: (token: string, profile: ProfileUpdate) =>
    apiRequest<Profile>("/profile", { method: "PUT", body: json(profile) }, token),
  performance: (token: string) => apiRequest<PerformanceProfile>("/profile/performance", {}, token),
  categories: (token: string) => apiRequest<Category[]>("/categories", {}, token),

  startAssessment: (token: string, restart = false) =>
    apiRequest<Session>(`/assessment/start${restart ? "?restart=true" : ""}`, { method: "POST" }, token),
  skipAssessment: (token: string) => apiRequest<void>("/assessment/skip", { method: "POST" }, token),

  /** Sin `category`, la sesión mezcla todas las áreas; con `category`, solo trae actividades de esa área. */
  createSession: (token: string, options: { durationMinutes?: number; category?: string } = {}) =>
    apiRequest<Session>(
      "/sessions",
      options.durationMinutes || options.category ? { method: "POST", body: json(options) } : { method: "POST" },
      token,
    ),
  session: (token: string, id: string) => apiRequest<Session>(`/sessions/${id}`, {}, token),
  startSession: (token: string, id: string) => apiRequest<Session>(`/sessions/${id}/start`, { method: "POST" }, token),
  recordAttempt: (token: string, sessionId: string, attempt: AttemptRequest) =>
    apiRequest<{ attemptId: string; recordedAt: string }>(
      `/sessions/${sessionId}/attempts`,
      { method: "POST", body: json(attempt) },
      token,
    ),
  completeSession: (token: string, id: string) =>
    apiRequest<SessionResult>(`/sessions/${id}/complete`, { method: "POST" }, token),
  abandonSession: (token: string, id: string) => apiRequest<void>(`/sessions/${id}/abandon`, { method: "POST" }, token),
  sessionResult: (token: string, id: string) => apiRequest<SessionResult>(`/sessions/${id}/result`, {}, token),
  sessions: (token: string, page = 0, size = 20) =>
    apiRequest<SessionHistoryPage>(`/sessions?page=${page}&size=${size}`, {}, token),

  progressSummary: (token: string) => apiRequest<ProgressSummary>("/progress/summary", {}, token),
  categoryProgress: (token: string, granularity: "week" | "month" = "week") =>
    apiRequest<CategoryProgress[]>(`/progress/categories?granularity=${granularity}`, {}, token),
  gamification: (token: string) => apiRequest<GamificationState>("/gamification/me", {}, token),
  achievements: (token: string) => apiRequest<Achievement[]>("/achievements", {}, token),
  /** Solo ADMIN: evolución del desempeño según la constancia, en agregados por grupo. */
  consistencyReport: (token: string) => apiRequest<ConsistencyReport>("/admin/metrics/consistency", {}, token),
};

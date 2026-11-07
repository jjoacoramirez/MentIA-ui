import { vi } from "vitest";

/**
 * API de MentIA simulada en memoria para los tests del recorrido. Responde con la forma del contrato
 * (openapi.yaml del backend) y los mismos códigos de error. Cada sesión trae dos actividades de
 * "Secuencia inversa" con un único símbolo, así el test sabe la respuesta correcta.
 */
export interface FakeUser { password: string; role: "USER" | "ADMIN"; profile: Record<string, unknown>; hasLevels: boolean }

export function installFakeApi() {
  const users = new Map<string, FakeUser>();
  const tokens = new Map<string, string>();
  const sessions = new Map<string, Record<string, unknown>>();
  const history: Record<string, unknown>[] = [];
  const calls: { method: string; path: string; body?: unknown }[] = [];
  let counter = 0;

  const problem = (status: number, code: string, detail: string) =>
    new Response(JSON.stringify({ status, code, title: code, detail }), { status, headers: { "Content-Type": "application/problem+json" } });
  const ok = (body: unknown, status = 200) =>
    status === 204 ? new Response(null, { status }) : new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  function newSession(username: string, type: string) {
    const id = `session-${++counter}`;
    const items = [1, 2].map((position) => ({
      sessionItemId: `${id}-item-${position}`,
      position,
      exerciseCode: "REVERSE_SEQUENCE",
      exerciseType: "REVERSE_SEQUENCE",
      category: position === 1 ? "MEMORIA_TRABAJO" : "ATENCION",
      modality: "VISUAL",
      difficultyLevel: 3,
      variantKey: "letras",
      seed: 42 + position,
      params: { sequenceLength: 2, itemDisplayMs: 500 },
      content: { symbols: ["A"] },
      instructions: "Vas a ver una secuencia de elementos. Repetila en el orden inverso.",
    }));
    const session = { id, username, type, status: "GENERATED", plannedMinutes: 10, estimatedDurationSeconds: 120, items, rationale: [], createdAt: new Date().toISOString(), attempts: 0 };
    sessions.set(id, session);
    return session;
  }
  const view = (s: Record<string, unknown>) => {
    const { username: _u, attempts: _a, ...rest } = s;
    return rest;
  };

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(String(input), "http://localhost");
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = (init.method || "GET").toUpperCase();
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path, body });
    const auth = new Headers(init.headers).get("Authorization")?.replace("Bearer ", "");
    const username = auth ? tokens.get(auth) : undefined;
    const user = username ? users.get(username) : undefined;

    if (method === "POST" && path === "/auth/register") {
      if (users.has(body.username)) return problem(409, "USERNAME_TAKEN", "Ese nombre de usuario ya está en uso. Probá con otro.");
      users.set(body.username, {
        password: body.password, role: "USER", hasLevels: false,
        profile: { ageRange: body.ageRange, educationLevel: null, sessionMinutes: 10, goals: [], onboardingCompleted: false, assessmentCompleted: false },
      });
      return ok({ userId: `user-${body.username}`, recoveryCode: "7KQ2M-X9PTD-4HBWE-RC6ZN" }, 201);
    }
    if (method === "POST" && path === "/auth/login") {
      const found = users.get(body.username);
      if (!found || found.password !== body.password) return problem(401, "INVALID_CREDENTIALS", "El nombre de usuario o la contraseña no son correctos.");
      const token = `token-${++counter}`;
      tokens.set(token, body.username);
      return ok({ accessToken: token, tokenType: "Bearer", expiresIn: 86400, role: found.role });
    }
    if (method === "POST" && path === "/auth/recovery/reset") {
      const found = users.get(body.username);
      if (!found || body.recoveryCode !== "7KQ2M-X9PTD-4HBWE-RC6ZN") return problem(400, "INVALID_RECOVERY", "No pudimos restablecer la contraseña con esos datos.");
      found.password = body.newPassword;
      return ok({ recoveryCode: "ABCDE-FGHJK-LMNPQ-RSTUV" });
    }
    if (!user || !username) return problem(401, "UNAUTHORIZED", "Necesitás iniciar sesión para acceder a este recurso.");

    if (method === "POST" && path === "/auth/logout") { tokens.delete(auth!); return ok(null, 204); }
    if (method === "POST" && path === "/auth/recovery/regenerate") {
      if (body.password !== user.password) return problem(401, "INVALID_CREDENTIALS", "La contraseña no es correcta.");
      return ok({ recoveryCode: "NUEVO-CODIG-OPARA-PROBA" });
    }
    if (path === "/profile" && method === "GET") return ok(user.profile);
    if (path === "/profile" && method === "PUT") { Object.assign(user.profile, body); return ok(user.profile); }
    if (path === "/categories") return ok([
      { code: "ATENCION", name: "Atención", description: "Foco y respuesta selectiva.", mvp: true },
      { code: "MEMORIA_TRABAJO", name: "Memoria de trabajo", description: "Retener y reorganizar.", mvp: true },
      { code: "MEMORIA_VISUAL", name: "Memoria visual", description: "Imágenes y posiciones.", mvp: true },
    ]);
    if (path === "/profile/performance") return ok({ categories: user.hasLevels ? [{ category: "ATENCION", score: 70, level: 3, progress: 35 }] : [] });
    if (path === "/gamification/me") return ok({ xp: user.hasLevels ? 25 : 0, level: 1, xpIntoLevel: user.hasLevels ? 25 : 0, xpForNextLevel: 100 });
    if (path === "/progress/summary") return ok({ sessionsCompleted: history.filter((h) => h.status === "COMPLETED").length, sessionsAbandoned: history.filter((h) => h.status === "ABANDONED").length, activeDaysLast30: 1, currentStreakDays: 1, dailyGoal: null });
    if (path === "/progress/categories") return ok([]);
    if (path === "/sessions" && method === "GET") return ok({ items: history, page: 0, size: 30, totalElements: history.length });
    if (path === "/admin/metrics/consistency") {
      if (user.role !== "ADMIN") return problem(403, "FORBIDDEN", "No tenés acceso a este recurso.");
      const group = (label: string, min: number, max: number | null, users: number, accuracyDelta: number | null, levelDelta: number | null) => ({
        label, minActiveDays: min, maxActiveDays: max, users, sessionsCompleted: users * min, sessionsAbandoned: 0,
        avgSessionsPerUser: users ? min : null, abandonRate: users ? 0 : null, usersWithTrend: accuracyDelta == null ? 0 : users,
        avgFirstAccuracy: accuracyDelta == null ? null : 0.6, avgLastAccuracy: accuracyDelta == null ? null : 0.6 + accuracyDelta,
        avgAccuracyDelta: accuracyDelta, avgLevelDelta: levelDelta,
        categories: levelDelta == null ? [] : [{ category: "ATENCION", users, avgLevelDelta: levelDelta }],
      });
      return ok({
        generatedAt: "2026-11-07T12:00:00Z", timeZone: "America/Argentina/Buenos_Aires",
        totals: { users: 9, usersWithStartingPoint: 8, usersWithTraining: 7, sessionsCompleted: 30, sessionsAbandoned: 3, abandonRate: 0.091 },
        groups: [group("Sin sesiones completadas", 0, 0, 2, null, null), group("1 día", 1, 1, 3, null, 0), group("2 a 3 días", 2, 3, 2, 0.08, 0.5),
          group("4 a 7 días", 4, 7, 2, 0.15, 1.25), group("8 días o más", 8, null, 0, null, null)],
      });
    }
    if (path === "/achievements") return ok([
      { code: "FIRST_SESSION", name: "Primer paso", description: "Completaste tu primera sesión en MentIA.", unlocked: history.some((h) => h.status === "COMPLETED"), unlockedAt: null },
    ]);
    if (method === "POST" && path === "/assessment/skip") {
      if (user.role !== "ADMIN") return problem(403, "FORBIDDEN", "No tenés acceso a este recurso.");
      user.hasLevels = true;
      return ok(null, 204);
    }
    if (method === "POST" && path === "/assessment/start") return ok(view(newSession(username, "INITIAL_ASSESSMENT")), 201);
    if (method === "POST" && path === "/sessions") {
      if (!user.hasLevels) return problem(409, "ASSESSMENT_REQUIRED", "Antes de entrenar necesitás completar la evaluación inicial.");
      return ok(view(newSession(username, "TRAINING")), 201);
    }
    const match = path.match(/^\/sessions\/([^/]+)\/(start|attempts|complete|abandon|result)$/);
    const session = match ? sessions.get(match[1]) : undefined;
    if (match && session) {
      const action = match[2];
      if (action === "start") { session.status = "IN_PROGRESS"; return ok(view(session)); }
      if (action === "attempts") { (session.attempts as number)++; return ok({ attemptId: `attempt-${++counter}`, recordedAt: new Date().toISOString() }, 201); }
      if (action === "abandon") {
        session.status = "ABANDONED";
        history.unshift({ id: session.id, type: session.type, status: "ABANDONED", finishedAt: new Date().toISOString(), accuracy: 1, itemsCompleted: session.attempts, totalTimeMs: 1000 });
        return ok(null, 204);
      }
      const result = {
        sessionId: session.id, type: session.type, status: "COMPLETED", itemsTotal: 2, itemsCompleted: session.attempts,
        correctCount: session.attempts, errorCount: 0, accuracy: 1, totalTimeMs: 2000,
        categories: [{ category: "ATENCION", itemsCompleted: 1, accuracy: 1, avgResponseTimeMs: 1000, difficultyLevelBefore: 3, difficultyLevelAfter: 5, levelProgressBefore: 80, levelProgressAfter: 50 }],
        adaptations: [{ category: "ATENCION", from: 3, to: 5, direction: "UP" }],
        comparison: null,
        gamification: { xpEarned: 25, xpTotal: 25, level: 1, leveledUp: false, unlockedAchievements: [{ code: "FIRST_SESSION", name: "Primer paso" }] },
      };
      if (action === "complete") {
        session.status = "COMPLETED";
        session.result = result;
        user.hasLevels = true;
        if (session.type === "INITIAL_ASSESSMENT") user.profile.assessmentCompleted = true;
        history.unshift({ id: session.id, type: session.type, status: "COMPLETED", finishedAt: new Date().toISOString(), accuracy: 1, itemsCompleted: session.attempts, totalTimeMs: 2000 });
        return ok(result);
      }
      if (action === "result") return session.result ? ok(session.result) : problem(409, "SESSION_STATE_INVALID", "La sesión todavía no tiene resultado.");
    }
    return problem(404, "NOT_FOUND", `Ruta no simulada: ${method} ${path}`);
  });

  vi.stubGlobal("fetch", fetchMock);
  return { users, calls, fetchMock };
}

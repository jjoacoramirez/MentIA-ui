import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useApp } from "./AppContext";
import {
  ApiError,
  mentiaApi,
  setUnauthorizedHandler,
  setReplacementTokenHandler,
  type AgeRange,
  type Category,
  type GamificationState,
  type Profile,
  type ProgressSummary,
  type Role,
  type Session,
  type SessionItem,
  type SessionResult,
  type SessionSummary,
} from "../services/api";
import type { GameOutcome } from "../games";
import { detachReminder, resyncReminder } from "../services/push";
import { clearAuth, loadAuth, loadDoneItems, saveAuth, saveDoneItems, shouldRenewAuth, type StoredAuth } from "./authStorage";

interface Journey {
  /** false mientras se restaura una sesión guardada al recargar. */
  ready: boolean;
  username: string;
  role: Role | null;
  token: string | null;
  isAdmin: boolean;
  register: (alias: string, password: string, ageRange: AgeRange) => Promise<string | null>;
  login: (alias: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (alias: string, code: string, newPassword: string) => Promise<string>;
  regenerateRecoveryCode: (password: string) => Promise<string>;

  profile: Profile | null;
  categories: Category[];
  minutes: number;
  goals: string[];
  configured: boolean;
  assessed: boolean;
  canTrain: boolean;
  configure: (minutes: number, goals: string[]) => Promise<void>;

  gamification: GamificationState | null;
  summary: ProgressSummary | null;
  history: SessionSummary[];
  refreshStats: () => Promise<void>;

  session: Session | null;
  assessment: boolean;
  doneItems: string[];
  /** `restart` repite la evaluación; `category` arma un entrenamiento de una sola área. */
  begin: (kind: "assessment" | "training", options?: { restart?: boolean; category?: string }) => Promise<void>;
  recordAttempt: (item: SessionItem, outcome: GameOutcome) => Promise<void>;
  finish: () => Promise<void>;
  abandon: () => Promise<void>;
  skipAssessment: () => Promise<void>;
  result: SessionResult | null;
  openResult: (sessionId: string) => Promise<void>;

  busy: boolean;
  notice: string;
  clearNotice: () => void;
}

const Context = createContext<Journey | null>(null);
const HISTORY_SIZE = 30;

export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const { setCurrentTab, updateUser } = useApp();
  const [auth, setAuth] = useState<StoredAuth | null>(loadAuth);
  const [ready, setReady] = useState(!auth);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [gamification, setGamification] = useState<GamificationState | null>(null);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [history, setHistory] = useState<SessionSummary[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [doneItems, setDoneItems] = useState<string[]>([]);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const token = auth?.token ?? null;
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const authRef = useRef(auth);
  authRef.current = auth;
  const renewing = useRef<Promise<void> | null>(null);
  const replaced = useRef(new Set<string>());
  const loggingOut = useRef(false);
  const restorePending = useRef(!!auth);

  const reset = useCallback(() => {
    clearAuth();
    tokenRef.current = null;
    authRef.current = null;
    replaced.current.clear();
    setAuth(null);
    setProfile(null);
    setGamification(null);
    setSummary(null);
    setHistory([]);
    setSession(null);
    setResult(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler((failedToken) => {
      if (failedToken !== tokenRef.current) return;
      reset();
      setNotice("Tu sesión se cerró o venció. Ingresá de nuevo para continuar.");
      setCurrentTab("ingreso");
    });
    setReplacementTokenHandler(async (oldToken) => {
      await renewing.current?.catch(() => undefined);
      const stored = loadAuth();
      if (stored && stored.username === authRef.current?.username && stored.token !== oldToken) {
        replaced.current.add(oldToken);
        authRef.current = stored;
        tokenRef.current = stored.token;
        setAuth(stored);
      }
      return replaced.current.has(oldToken) ? tokenRef.current : null;
    });
    return () => { setUnauthorizedHandler(null); setReplacementTokenHandler(null); };
  }, [reset, setCurrentTab]);

  const renewAccess = useCallback(async () => {
    if (loggingOut.current) return;
    if (renewing.current) return renewing.current;
    const previous = authRef.current;
    if (!previous || !shouldRenewAuth(previous)) return;
    const renew = async () => {
      const stored = loadAuth();
      if (stored?.token !== previous.token) {
        if (stored?.username === previous.username && tokenRef.current === previous.token) {
          replaced.current.add(previous.token);
          authRef.current = stored;
          tokenRef.current = stored.token;
          setAuth(stored);
        }
        return;
      }
      const response = await mentiaApi.refreshSession(previous.token);
      if (tokenRef.current !== previous.token) return;
      const next = { ...previous, token: response.accessToken, role: response.role,
        renewedAt: Date.now(), expiresAt: Date.now() + response.expiresIn * 1000 };
      replaced.current.add(previous.token);
      saveAuth(next);
      authRef.current = next;
      tokenRef.current = next.token;
      setAuth(next);
    };
    // Una sola renovación por navegador, aunque MentIA esté abierta en varias pestañas.
    const request = navigator.locks ? navigator.locks.request("mentia-session-renewal", renew) : renew();
    renewing.current = request;
    try { await request; } finally { renewing.current = null; }
  }, []);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== "mentia_auth_v1" && event.key !== null) return;
      const stored = loadAuth();
      if (stored?.token === tokenRef.current) return;
      if (!stored) { reset(); setCurrentTab("landing"); return; }
      // Una cuenta diferente debe cargar sus propios datos desde cero.
      if (authRef.current?.username !== stored.username) {
        window.location.reload();
        return;
      }
      if (tokenRef.current) replaced.current.add(tokenRef.current);
      authRef.current = stored;
      tokenRef.current = stored.token;
      setAuth(stored);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [reset, setCurrentTab]);

  const refreshStats = useCallback(async () => {
    const t = tokenRef.current;
    if (!t) return;
    const [g, s, h] = await Promise.all([
      mentiaApi.gamification(t),
      mentiaApi.progressSummary(t),
      mentiaApi.sessions(t, 0, HISTORY_SIZE),
    ]);
    setGamification(g);
    setSummary(s);
    setHistory(h.items);
  }, []);

  const loadAll = useCallback(async (t: string) => {
    const [p, c] = await Promise.all([mentiaApi.profile(t), mentiaApi.categories(t)]);
    setProfile(p);
    setCategories(c);
    await refreshStats();
    return p;
  }, [refreshStats]);

  // Al recargar con una sesión guardada, se restaura el perfil y se vuelve al inicio.
  useEffect(() => {
    if (!auth) return;
    renewAccess().then(() => tokenRef.current ? loadAll(tokenRef.current) : null)
      .then((p) => {
        if (p && tokenRef.current) {
          restorePending.current = false;
          setCurrentTab(!p.onboardingCompleted ? "configuracion" : "inicio");
        }
      })
      .catch((error) => {
        // Un fallo de red/servidor no equivale a un token inválido ni borra el acceso guardado.
        if (tokenRef.current && !(error instanceof ApiError && error.status === 401)) {
          setNotice("No pudimos cargar tus datos. Tu sesión sigue guardada; reintentaremos al recuperar la conexión.");
          setCurrentTab("inicio");
        }
      })
      .finally(() => setReady(true));
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !auth) return;
    const resume = async () => {
      if (document.hidden || loggingOut.current) return;
      try {
        await renewAccess();
        const t = tokenRef.current;
        if (t && (restorePending.current || !profile)) {
          const p = await loadAll(t);
          if (t !== tokenRef.current) return;
          restorePending.current = false;
          setNotice("");
          setCurrentTab(!p.onboardingCompleted ? "configuracion" : "inicio");
        }
      } catch { /* Se vuelve a intentar; los 401 se gestionan en el cliente de API. */ }
    };
    window.addEventListener("online", resume);
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    const interval = window.setInterval(resume, 15 * 60 * 1000);
    return () => {
      window.removeEventListener("online", resume);
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", resume);
      window.clearInterval(interval);
    };
  }, [ready, auth?.token, profile, renewAccess, loadAll, setCurrentTab]);

  // Con los recordatorios ya elegidos, este navegador se vuelve a vincular a la cuenta que inicia sesión.
  useEffect(() => {
    if (ready && auth) void resyncReminder(auth.token, auth.username).catch(() => undefined);
  }, [ready, auth?.token, auth?.username]); // eslint-disable-line react-hooks/exhaustive-deps

  // Los datos que muestran Inicio y Perfil salen del servidor.
  useEffect(() => {
    if (!auth) return;
    const completed = history.filter((r) => r.status === "COMPLETED" && r.accuracy != null);
    const now = Date.now();
    updateUser({
      name: auth.username,
      username: auth.username,
      level: gamification?.level ?? 1,
      xp: gamification?.xp ?? 0,
      streakDays: summary?.currentStreakDays ?? 0,
      completedActivities: summary?.sessionsCompleted ?? 0,
      accuracy: completed.length
        ? Math.round((100 * completed.reduce((s, r) => s + (r.accuracy ?? 0), 0)) / completed.length)
        : 0,
      weeklySessions: completed.filter((r) => r.finishedAt && now - Date.parse(r.finishedAt) < 7 * 864e5).length,
      totalPlayTime: `${Math.round(completed.reduce((s, r) => s + r.totalTimeMs, 0) / 60000)} min`,
    });
  }, [auth, gamification, summary, history, updateUser]);

  async function run<T>(action: () => Promise<T>): Promise<T> {
    setBusy(true);
    setNotice("");
    try {
      return await action();
    } finally {
      setBusy(false);
    }
  }

  function fail(error: unknown) {
    setNotice(error instanceof ApiError ? error.message : "Ocurrió un error inesperado. Probá de nuevo.");
  }

  async function login(alias: string, password: string) {
    await run(async () => {
      const response = await mentiaApi.login(alias, password);
      const stored = { token: response.accessToken, username: alias.toLowerCase(), role: response.role,
        renewedAt: Date.now(), expiresAt: Date.now() + response.expiresIn * 1000 };
      saveAuth(stored);
      tokenRef.current = stored.token;
      authRef.current = stored;
      setAuth(stored);
      const p = await loadAll(stored.token);
      restorePending.current = false;
      setCurrentTab(!p.onboardingCompleted ? "configuracion" : "inicio");
    });
  }

  async function logout() {
    loggingOut.current = true;
    await renewing.current?.catch(() => undefined);
    const t = tokenRef.current;
    if (t) {
      // El navegador deja de estar atado a esta cuenta: así otra persona que use el dispositivo no recibe sus avisos.
      await detachReminder(t);
      await mentiaApi.logout(t).catch(() => undefined);
    }
    reset();
    loggingOut.current = false;
    setCurrentTab("landing");
  }

  async function configure(minutes: number, goals: string[]) {
    const t = tokenRef.current;
    if (!t) return;
    const first = !profile?.onboardingCompleted;
    try {
      const p = await run(() => mentiaApi.updateProfile(t, { sessionMinutes: minutes, goals, onboardingCompleted: true }));
      setProfile(p);
      setCurrentTab(first && !p.assessmentCompleted ? "evaluacion" : "perfil");
    } catch (error) {
      fail(error);
    }
  }

  async function begin(kind: "assessment" | "training", { restart = false, category }: { restart?: boolean; category?: string } = {}) {
    const t = tokenRef.current;
    if (!t) return;
    try {
      const created = await run(() =>
        kind === "assessment" ? mentiaApi.startAssessment(t, restart) : mentiaApi.createSession(t, { category }),
      );
      const started = created.status === "GENERATED" ? await mentiaApi.startSession(t, created.id) : created;
      setSession(started);
      setDoneItems(loadDoneItems(started.id));
      setResult(null);
      setCurrentTab("juego");
    } catch (error) {
      if (error instanceof ApiError && error.code === "ASSESSMENT_REQUIRED") {
        setNotice("Antes de entrenar necesitás completar la evaluación inicial.");
        setCurrentTab("evaluacion");
        return;
      }
      fail(error);
    }
  }

  async function recordAttempt(item: SessionItem, outcome: GameOutcome) {
    const t = tokenRef.current;
    if (!t || !session) return;
    try {
      await mentiaApi.recordAttempt(t, session.id, {
        clientAttemptId: crypto.randomUUID(),
        sessionItemId: item.sessionItemId,
        isCorrect: outcome.isCorrect,
        accuracy: Math.max(0, Math.min(1, outcome.accuracy)),
        responseTimeMs: Math.max(0, Math.round(outcome.responseTimeMs)),
        response: outcome.response,
        metrics: outcome.metrics,
      });
    } catch (error) {
      // Al retomar una sesión, un ítem que ya tenía intento responde 409: ya está registrado.
      if (!(error instanceof ApiError && error.code === "ATTEMPT_CONFLICT")) throw error;
    }
    const next = [...doneItems, item.sessionItemId];
    setDoneItems(next);
    saveDoneItems(session.id, next);
  }

  async function finish() {
    const t = tokenRef.current;
    if (!t || !session) return;
    try {
      const r = await run(() => mentiaApi.completeSession(t, session.id));
      saveDoneItems(session.id, null);
      setResult(r);
      setSession(null);
      setCurrentTab("resultado");
      const [p] = await Promise.all([mentiaApi.profile(t), refreshStats()]);
      setProfile(p);
    } catch (error) {
      fail(error);
    }
  }

  async function abandon() {
    const t = tokenRef.current;
    if (!t || !session) return;
    try {
      await run(() => mentiaApi.abandonSession(t, session.id));
    } catch (error) {
      // Si ya estaba cerrada (por ejemplo, vencida), se sigue igual.
      if (!(error instanceof ApiError && error.code === "SESSION_STATE_INVALID")) fail(error);
    }
    saveDoneItems(session.id, null);
    setSession(null);
    setCurrentTab("historial");
    await refreshStats().catch(() => undefined);
  }

  async function skipAssessment() {
    const t = tokenRef.current;
    if (!t) return;
    try {
      await run(() => mentiaApi.skipAssessment(t));
      setCurrentTab("inicio");
    } catch (error) {
      fail(error);
    }
  }

  async function openResult(sessionId: string) {
    const t = tokenRef.current;
    if (!t) return;
    try {
      setResult(await run(() => mentiaApi.sessionResult(t, sessionId)));
      setCurrentTab("resultado");
    } catch (error) {
      fail(error);
    }
  }

  const role = auth?.role ?? null;
  const assessed = profile?.assessmentCompleted ?? false;
  return (
    <Context.Provider
      value={{
        ready,
        username: auth?.username ?? "",
        role,
        token,
        isAdmin: role === "ADMIN",
        register: async (alias, password, ageRange) =>
          (await run(() => mentiaApi.register(alias, password, ageRange))).recoveryCode,
        login,
        logout,
        resetPassword: async (alias, code, newPassword) =>
          (await run(() => mentiaApi.resetPassword(alias, code, newPassword))).recoveryCode,
        regenerateRecoveryCode: async (password) =>
          (await run(() => mentiaApi.regenerateRecoveryCode(tokenRef.current!, password))).recoveryCode,
        profile,
        categories,
        minutes: profile?.sessionMinutes ?? 10,
        goals: profile?.goals ?? [],
        configured: profile?.onboardingCompleted ?? false,
        assessed,
        // Un admin puede entrenar sin evaluación si la salteó; si no, el servidor responde ASSESSMENT_REQUIRED.
        canTrain: assessed || role === "ADMIN",
        configure,
        gamification,
        summary,
        history,
        refreshStats,
        session,
        assessment: session?.type === "INITIAL_ASSESSMENT",
        doneItems,
        begin,
        recordAttempt,
        finish,
        abandon,
        skipAssessment,
        result,
        openResult,
        busy,
        notice,
        clearNotice: () => setNotice(""),
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useJourney() {
  const context = useContext(Context);
  if (!context) throw new Error("Falta JourneyProvider");
  return context;
}

/** Nombre visible de una categoría a partir de su código. */
export function categoryName(categories: Category[], code: string) {
  return categories.find((c) => c.code === code)?.name ?? code;
}

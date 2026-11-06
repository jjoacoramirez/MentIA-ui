import { Select } from "../components/Select";
import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { categoryName, useJourney } from "../context/JourneyContext";
import { ApiError, mentiaApi, type AgeRange, type SessionSummary } from "../services/api";
import { useApiData } from "../hooks/useApiData";
export function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flow-page">
      <h1 className="font-space text-2xl font-bold mb-4">{title}</h1>
      {children}
    </div>
  );
}
const errorMessage = (e: unknown) =>
  e instanceof ApiError ? e.message : "Ocurrió un error inesperado. Probá de nuevo.";
export function AuthScreen({
  mode,
}: {
  mode: "registro" | "ingreso" | "recuperacion";
}) {
  const { setCurrentTab } = useApp();
  const { register, login, resetPassword, busy } = useJourney();
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [age, setAge] = useState<AgeRange>("18-24");
  const [code, setCode] = useState("");
  const [issued, setIssued] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const username = alias.trim().toLowerCase();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[a-z0-9_.]{3,30}$/.test(username))
      return setError(
        "Usá un alias de 3 a 30 caracteres: letras, números, punto o guion bajo.",
      );
    if (mode !== "ingreso" && (password.length < 10 || new TextEncoder().encode(password).length > 72))
      return setError(
        "La contraseña debe tener al menos 10 caracteres y hasta 72 bytes.",
      );
    if (mode !== "ingreso" && password !== repeat)
      return setError("Las contraseñas no coinciden.");
    try {
      if (mode === "ingreso") await login(username, password);
      else if (mode === "registro") {
        const recoveryCode = await register(username, password, age);
        if (recoveryCode) setIssued(recoveryCode);
        else await login(username, password);
      } else {
        setIssued(await resetPassword(username, code.trim(), password));
        setCode("");
      }
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  async function continueAfterCode() {
    setError("");
    try {
      // Con el código guardado, se entra directo con la contraseña recién elegida.
      await login(username, password);
    } catch (err) {
      setError(errorMessage(err));
      setIssued("");
      setCurrentTab("ingreso");
    } finally {
      setPassword("");
      setRepeat("");
    }
  }
  if (issued)
    return (
      <Panel title="Guardá tu código">
        <section className="flow-card">
          <p>
            Es tu código de recuperación. Se muestra una sola vez: guardalo en un
            lugar seguro. Lo vas a necesitar si olvidás tu contraseña.
          </p>
          <code className="block break-all my-4 select-all text-xl font-bold">{issued}</code>
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={saved}
              onChange={(e) => setSaved(e.target.checked)}
            />
            Ya guardé el código
          </label>
          {error && <p role="alert" className="text-rose-600 dark:text-rose-300 mt-3">{error}</p>}
          <button
            className="flow-primary mt-4"
            disabled={!saved || busy}
            onClick={continueAfterCode}
          >
            Continuar
          </button>
        </section>
      </Panel>
    );
  return (
    <Panel
      title={
        mode === "registro"
          ? "Crear cuenta"
          : mode === "ingreso"
            ? "Ingresar"
            : "Recuperar acceso"
      }
    >
      <p className="mb-4 text-sm">
        {mode === "recuperacion"
          ? "Usá el código de recuperación que guardaste al crear tu cuenta. No pedimos email ni teléfono."
          : "Solo pedimos un alias, una contraseña y tu rango etario. No uses tu nombre real como alias."}
      </p>
      <form onSubmit={submit} className="flow-card flex flex-col gap-4">
        <label>
          Alias
          <input
            required
            autoComplete="username"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="explorador_01"
          />
        </label>
        {mode === "registro" && (
          <label>
            Rango etario
            <Select value={age} onChange={(e) => setAge(e.target.value as AgeRange)}>
              {["18-24", "25-30", "31-40", "41+"].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </Select>
          </label>
        )}
        {mode === "recuperacion" && (
          <label>
            Código de recuperación
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
        )}
        <label>
          {mode === "recuperacion" ? "Nueva contraseña" : "Contraseña"}
          <input
            required
            type="password"
            autoComplete={
              mode === "ingreso" ? "current-password" : "new-password"
            }
            minLength={mode === "ingreso" ? undefined : 10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {mode !== "ingreso" && (
          <label>
            Repetir contraseña
            <input
              required
              type="password"
              autoComplete="new-password"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
            />
          </label>
        )}
        {error && (
          <p role="alert" className="text-rose-600 dark:text-rose-300">
            {error}
          </p>
        )}
        <button className="flow-primary" type="submit" disabled={busy}>
          {mode === "ingreso"
            ? "Ingresar"
            : mode === "registro"
              ? "Crear cuenta"
              : "Restablecer contraseña"}
        </button>
      </form>
      <div className="flex flex-wrap gap-4 mt-5">
        <button
          className="flow-link"
          onClick={() =>
            setCurrentTab(mode === "registro" ? "ingreso" : "registro")
          }
        >
          {mode === "registro" ? "Ya tengo una cuenta" : "Crear cuenta"}
        </button>
        {mode === "ingreso" && (
          <button
            className="flow-link"
            onClick={() => setCurrentTab("recuperacion")}
          >
            Olvidé mi contraseña
          </button>
        )}
        <button className="flow-link" onClick={() => setCurrentTab("landing")}>
          Volver
        </button>
      </div>
    </Panel>
  );
}
export function ConfigurationScreen() {
  const { minutes, goals, configure, configured, categories, busy } = useJourney();
  const { setCurrentTab } = useApp();
  const [duration, setDuration] = useState(minutes);
  const [selected, setSelected] = useState(goals.length ? goals : categories.filter((c) => c.mvp).map((c) => c.code));
  return (
    <Panel title="Tu entrenamiento">
      <p className="mb-4">
        Elegí la duración preferida y las áreas que querés trabajar. Podés
        cambiarlas después.
      </p>
      <form
        className="flow-card flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          configure(duration, selected);
        }}
      >
        <label>
          Duración preferida
          <Select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            {[5, 10, 15, 20, 25, 30].map((n) => (
              <option key={n} value={n}>
                {n} minutos
              </option>
            ))}
          </Select>
        </label>
        <fieldset>
          <legend className="mb-3">Áreas de entrenamiento (hasta 4)</legend>
          {categories.map((c) => (
            <label className="flex gap-3 mb-3" key={c.code}>
              <input
                type="checkbox"
                checked={selected.includes(c.code)}
                disabled={!selected.includes(c.code) && selected.length >= 4}
                onChange={() =>
                  setSelected((p) =>
                    p.includes(c.code)
                      ? p.filter((x) => x !== c.code)
                      : [...p, c.code],
                  )
                }
              />
              <span>
                {c.name}
                {c.description && <span className="block text-xs text-slate-500 dark:text-slate-400">{c.description}</span>}
              </span>
            </label>
          ))}
        </fieldset>
        <button className="flow-primary" disabled={!selected.length || busy}>
          Guardar y continuar
        </button>
        {configured && (
          <button
            type="button"
            className="flow-link"
            onClick={() => setCurrentTab("perfil")}
          >
            Cancelar
          </button>
        )}
      </form>
    </Panel>
  );
}
export function TrainingScreen() {
  const { minutes, begin, skipAssessment, isAdmin, assessed, busy, goals, categories } = useJourney();
  const { currentTab, setCurrentTab } = useApp();
  const initial = currentTab === "evaluacion";
  return (
    <Panel title={!initial ? "Preparar entrenamiento" : "Evaluación inicial"}>
      <section className="flow-card">
        <p className="text-lg font-bold mb-3">
          {!initial ? "Una sesión a tu medida" : "Tu punto de partida"}
        </p>
        <p>
          {initial
            ? "La evaluación inicial establece tu punto de partida en MentIA: dos actividades breves de cada área, en el mismo nivel para todos. Los resultados describen tu desempeño dentro de la plataforma."
            : `Armamos una sesión de unos ${minutes} minutos con actividades de tus áreas, en el nivel que corresponde a tu desempeño y rotando ejercicios para que no se repitan.`}
        </p>
        {!initial && goals.length > 0 && (
          <p className="mt-3 text-sm text-accent">
            Áreas elegidas: {goals.map((g) => categoryName(categories, g)).join(" · ")}
          </p>
        )}
        <ol className="list-decimal pl-5 my-5 space-y-2">
          <li>Leé las instrucciones de cada actividad.</li>
          <li>Respondé a tu ritmo; podés pausar cuando quieras.</li>
          <li>Al terminar, revisá tus resultados y cómo sigue tu nivel.</li>
        </ol>
        {initial && assessed && (
          <p className="text-sm mb-4">Ya completaste la evaluación. Si la repetís, se reemplaza tu punto de partida.</p>
        )}
        <button className="flow-primary" disabled={busy} onClick={() => begin(initial ? "assessment" : "training", initial && assessed)}>
          {!initial ? "Comenzar sesión" : assessed ? "Repetir evaluación" : "Comenzar evaluación"}
        </button>
        {initial && !assessed && (
          <button className="flow-link mt-4" onClick={() => setCurrentTab("inicio")}>Hacerla más tarde</button>
        )}
        {initial && isAdmin && (
          <>
            <button className="flow-secondary mt-3" disabled={busy} onClick={skipAssessment}>Saltear (admin)</button>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">Herramienta de debug: deja el nivel 1 en todas las áreas sin hacer la evaluación.</p>
          </>
        )}
      </section>
    </Panel>
  );
}
export function ResultsScreen() {
  const { result, categories } = useJourney();
  const { setCurrentTab } = useApp();
  if (!result)
    return (
      <Panel title="Resultados">
        <p>Todavía no seleccionaste una sesión.</p>
      </Panel>
    );
  const delta = result.comparison ? Math.round(result.comparison.accuracyDelta * 100) : null;
  return (
    <Panel
      title={
        result.type === "INITIAL_ASSESSMENT"
          ? "Evaluación completada"
          : "Resultado de sesión"
      }
    >
      <section className="flow-card">
        <div className="grid grid-cols-2 gap-4">
          <Metric
            label="Aciertos"
            value={`${result.correctCount}/${result.itemsCompleted}`}
          />
          <Metric
            label="Precisión"
            value={`${Math.round(result.accuracy * 100)}%`}
          />
          <Metric
            label="Tiempo"
            value={`${Math.round(result.totalTimeMs / 1000)} s`}
          />
          {result.gamification && <Metric label="XP" value={`+${result.gamification.xpEarned}`} />}
        </div>
        {delta !== null && (
          <p className="mt-4 text-sm">
            Respecto de tu sesión anterior: {delta === 0 ? "misma precisión" : `${delta > 0 ? "+" : ""}${delta} puntos de precisión`}.
          </p>
        )}
        {result.gamification?.leveledUp && (
          <p className="mt-3 font-bold text-accent">¡Subiste al nivel {result.gamification.level} de MentIA!</p>
        )}
      </section>
      {result.categories.length > 0 && (
        <section className="flow-card mt-4">
          <h2 className="font-bold mb-3">{result.type === "INITIAL_ASSESSMENT" ? "Tu punto de partida por área" : "Por área"}</h2>
          {result.categories.map((c) => {
            const arrow = c.difficultyLevelAfter > c.difficultyLevelBefore ? "↑" : c.difficultyLevelAfter < c.difficultyLevelBefore ? "↓" : "→";
            return (
              <div key={c.category} className="flex justify-between py-2 border-b border-slate-300/20 text-sm">
                <span>{categoryName(categories, c.category)}</span>
                <span>{Math.round(c.accuracy * 100)}% · nivel {c.difficultyLevelBefore} {arrow} {c.difficultyLevelAfter}</span>
              </div>
            );
          })}
        </section>
      )}
      {!!result.gamification?.unlockedAchievements.length && (
        <section className="flow-card mt-4">
          <h2 className="font-bold mb-2">Logros desbloqueados</h2>
          {result.gamification.unlockedAchievements.map((a) => <p key={a.code}>★ {a.name}</p>)}
        </section>
      )}
      <button
        className="flow-primary mt-5"
        onClick={() => setCurrentTab("inicio")}
      >
        Continuar
      </button>
      <button
        className="flow-link mt-4"
        onClick={() => setCurrentTab("historial")}
      >
        Ver historial
      </button>
    </Panel>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <strong className="font-space text-2xl block">{value}</strong>
      <span className="text-sm">{label}</span>
    </div>
  );
}
const statusLabel: Record<string, string> = {
  COMPLETED: "Completada",
  ABANDONED: "Abandonada",
  GENERATED: "Sin empezar",
  IN_PROGRESS: "En curso",
};
export function HistoryScreen() {
  const { history, openResult, token } = useJourney();
  const [filter, setFilter] = useState("ALL");
  const [extra, setExtra] = useState<SessionSummary[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(history.length >= 30);
  const all = [...history, ...extra.filter((e) => !history.some((h) => h.id === e.id))];
  const visible = all.filter((r) => filter === "ALL" || r.status === filter);
  async function loadMore() {
    if (!token) return;
    const next = await mentiaApi.sessions(token, page + 1, 30);
    setExtra((p) => [...p, ...next.items]);
    setPage(page + 1);
    setHasMore((page + 2) * 30 < next.totalElements);
  }
  return (
    <Panel title="Historial">
      <label>
        Mostrar
        <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="ALL">Todas las sesiones</option>
          <option value="COMPLETED">Completadas</option>
          <option value="ABANDONED">Abandonadas</option>
        </Select>
      </label>
      <div className="history-grid mt-4 space-y-3">
        {!visible.length && (
          <p className="flow-card">
            No hay sesiones para este filtro. Comenzá desde Entrenar.
          </p>
        )}
        {visible.map((r) => {
          const complete = r.status === "COMPLETED";
          const when = r.finishedAt ? new Date(r.finishedAt).toLocaleString("es-AR") : "Sin finalizar";
          const content = <>
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="history-icon material-symbols-outlined" aria-hidden="true">{complete ? "task_alt" : "pause_circle"}</span>
              <span className={`status-badge ${complete ? "completed" : "abandoned"}`}>{statusLabel[r.status]}</span>
            </div>
            <strong className="block font-space">{r.type === "INITIAL_ASSESSMENT" ? "Evaluación inicial" : "Entrenamiento"} · {statusLabel[r.status]}</strong>
            <span className="block text-sm mt-2 text-slate-500 dark:text-slate-400">
              {when} · {r.itemsCompleted} actividades
            </span>
            {complete ? <span className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flow-link">
              Ver resultado · {Math.round((r.accuracy ?? 0) * 100)}%<span aria-hidden="true">→</span>
            </span> : <span className="block text-sm mt-3 text-slate-500 dark:text-slate-400">Sesión sin completar · sin XP</span>}
          </>;
          return complete ? <button className="flow-card history-card w-full text-left" key={r.id} onClick={() => openResult(r.id)}>{content}</button>
            : <article className="flow-card w-full text-left" key={r.id}>{content}</article>;
        })}
      </div>
      {hasMore && <button className="flow-link mt-4" onClick={loadMore}>Ver más sesiones</button>}
    </Panel>
  );
}
export function AchievementsScreen() {
  const { data, error, loading } = useApiData(mentiaApi.achievements);
  return (
    <Panel title="Tus logros">
      <p className="mb-4">Logros por usar MentIA con constancia. Se desbloquean al completar sesiones.</p>
      {loading && <p>Cargando logros…</p>}
      {error && <p role="alert">{error}</p>}
      <div className="achievements-grid space-y-3">
        {data?.map((a) => (
          <section className="flow-card" key={a.code}>
            <strong>
              {a.unlocked ? "★" : "☆"} {a.name}
            </strong>
            <p className="text-sm mt-2">{a.description}</p>
            <span className="text-accent text-sm">
              {a.unlocked ? `Obtenido${a.unlockedAt ? ` el ${new Date(a.unlockedAt).toLocaleDateString("es-AR")}` : ""}` : "Por descubrir"}
            </span>
          </section>
        ))}
      </div>
    </Panel>
  );
}

import React, { useEffect, useState } from "react";
import { ApiError, apiRequest, mentiaApi } from "../services/api";

interface Report {
  from: string;
  to: string;
  participants: number;
  activity: { day: string; active: number; started: number; completed: number; abandoned: number }[];
  cohorts: { bucket: number; participants: number; comparable: number; improved: number; meanChange: number | null }[];
  exercises: { code: string; name: string; category: string; attempts: number; accuracy: number; medianMs: number }[];
  options: { code: string; name: string; category: string; categoryName: string }[];
}

const number = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });
const signed = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2, signDisplay: "exceptZero" });
const cohortName = (bucket: number) => bucket === 1 ? "1 día" : bucket === 2 ? "2 a 3 días" : "4 días o más";
const percent = (part: number, total: number) => total ? `${number.format(100 * part / total)} %` : "—";
const date = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
const card = "flow-card space-y-3";
const control = "w-full rounded-xl border border-slate-400/40 bg-canvas px-3 py-2 text-ink";
const cell = "px-3 py-2 text-left";

export function AdminMetricsScreen() {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [days, setDays] = useState("30");
  const [category, setCategory] = useState("");
  const [exercise, setExercise] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [options, setOptions] = useState<Report["options"]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ days, category, exercise });
    setReport(null);
    setError("");
    apiRequest<Report>(`/admin/metrics?${query}`, { signal: controller.signal }, token)
      .then(data => {
        if (controller.signal.aborted) return;
        setOptions(data.options);
        setReport(data);
      })
      .catch((failure: unknown) => {
        if (controller.signal.aborted) return;
        if (failure instanceof ApiError && [401, 403].includes(failure.status)) setToken("");
        setError(failure instanceof ApiError ? failure.message : "No se pudo conectar con MentIA-api.");
      });
    return () => controller.abort();
  }, [token, days, category, exercise, revision]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = await mentiaApi.login(username.trim().toLowerCase(), password);
      if (session.role !== "ADMIN") {
        await mentiaApi.logout(session.accessToken).catch(() => {});
        setError("El panel requiere una cuenta con rol ADMIN.");
        return;
      }
      setToken(session.accessToken);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "No se pudo conectar con MentIA-api.");
    } finally {
      setPassword("");
      setBusy(false);
    }
  }

  const totals = report?.activity.reduce((sum, day) => ({
    started: sum.started + day.started,
    completed: sum.completed + day.completed,
    abandoned: sum.abandoned + day.abandoned,
  }), { started: 0, completed: 0, abandoned: 0 });
  const comparable = report?.cohorts.reduce((sum, row) => sum + row.comparable, 0) ?? 0;
  const improved = report?.cohorts.reduce((sum, row) => sum + row.improved, 0) ?? 0;
  const practiced = report?.cohorts.reduce((sum, row) => sum + row.participants, 0) ?? 0;
  const returning = report?.cohorts.filter(row => row.bucket > 1).reduce((sum, row) => sum + row.participants, 0) ?? 0;
  const maxChange = Math.max(1, ...report?.cohorts.map(row => Math.abs(row.meanChange ?? 0)) ?? []);
  const maxActivity = Math.max(1, ...report?.activity.map(row => row.completed) ?? []);
  const categories = [...new Map(options.map(row => [row.category, row.categoryName]))];
  const timeline = report ? Array.from({ length: Number(days) }, (_, index) => {
    const day = new Date(`${report.from}T12:00:00Z`);
    day.setUTCDate(day.getUTCDate() + index);
    const iso = day.toISOString().slice(0, 10);
    return { day: iso, completed: report.activity.find(row => row.day === iso)?.completed ?? 0 };
  }) : [];

  return <main className="min-h-dvh bg-canvas text-ink px-4 py-6 sm:px-8">
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm text-accent font-semibold">MentIA · Administración</p>
          <h1 className="text-3xl font-bold">Constancia y progreso</h1></div>
        <div className="flex gap-4 items-center">
          <a href="/" className="flow-link">Volver a MentIA</a>
          {token && <button className="flow-link" onClick={() => {
            const previous = token;
            setToken("");
            setReport(null);
            setOptions([]);
            setCategory("");
            setExercise("");
            setError("");
            void mentiaApi.logout(previous).catch(() => {});
          }}>Cerrar sesión</button>}
        </div>
      </header>
      {error && <p role="alert" className="flow-card text-rose-600 dark:text-rose-300">{error} {token && <button className="flow-link ml-3" onClick={() => setRevision(n => n + 1)}>Reintentar</button>}</p>}
      {!token ? <form className={`${card} max-w-md`} onSubmit={login}>
        <h2 className="text-xl font-bold">Ingreso de administración</h2>
        <label className="block">Alias<input className={control} autoComplete="username" required value={username} onChange={e => setUsername(e.target.value)} /></label>
        <label className="block">Contraseña<input className={control} autoComplete="current-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
        <button className="flow-primary" disabled={busy}>{busy ? "Ingresando…" : "Ingresar"}</button>
      </form> : <>
        <section aria-label="Filtros del reporte" className="flow-card grid gap-4 sm:grid-cols-3">
          <label>Período<select className={control} value={days} onChange={e => setDays(e.target.value)}>
            {[7, 30, 90].map(value => <option key={value} value={value}>Últimos {value} días</option>)}
          </select></label>
          <label>Categoría<select className={control} value={category} onChange={e => { setCategory(e.target.value); setExercise(""); }}>
            <option value="">Todas las categorías</option>
            {categories.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select></label>
          <label>Ejercicio<select className={control} value={exercise} onChange={e => setExercise(e.target.value)}>
            <option value="">Todos los ejercicios</option>
            {options.filter(row => !category || row.category === category).map(row => <option key={row.code} value={row.code}>{row.name}</option>)}
          </select></label>
        </section>
        {!report && !error && <p role="status">Cargando métricas…</p>}
        {report && totals && <>
          <p className="text-sm opacity-75">{date(report.from)} al {date(report.to)} · Entrenamientos · Hora de Argentina</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Participantes activos", number.format(report.participants), "Iniciaron al menos un entrenamiento"],
              ["Sesiones completadas", number.format(totals.completed), `${percent(totals.completed, totals.started)} de ${totals.started} iniciadas · ${totals.abandoned} abandonadas`],
              ["Volvieron otro día", percent(returning, practiced), `${returning} de ${practiced} con sesiones completadas`],
              ["Subieron de dificultad", percent(improved, comparable), `${improved} de ${comparable} participantes comparables`],
            ].map(([label, value, note]) => <section className={card} key={label}>
              <h2 className="text-sm font-semibold">{label}</h2>
              <strong className="block text-3xl text-accent tabular-nums">{value}</strong>
              <p className="text-xs opacity-75">{note}</p>
            </section>)}
          </div>
          <section className={card}>
            <h2 className="text-xl font-bold">Cambio de dificultad según días de práctica</h2>
            <p className="text-sm opacity-80">Compara la primera y la última sesión del mismo ejercicio. Cada participante cuenta una vez, con el promedio de sus cambios. La relación es descriptiva.</p>
            {report.cohorts.length === 0 && <p>Todavía no hay entrenamientos completados con estos filtros.</p>}
            <div className="grid gap-3 md:grid-cols-3">
              {report.cohorts.map(row => <div className="rounded-xl border border-slate-400/25 p-4 space-y-2" key={row.bucket}>
                <h3 className="font-semibold">{cohortName(row.bucket)}</h3>
                <p className="text-2xl font-bold">{row.meanChange === null ? "—" : `${signed.format(row.meanChange)} niveles`}</p>
                {row.meanChange !== null && <div className="relative h-3 rounded bg-slate-500/15" aria-hidden="true">
                  <span className="absolute left-1/2 h-full w-px bg-slate-500" />
                  <span className={`absolute h-full rounded ${row.meanChange < 0 ? "bg-amber-500" : "bg-brand"}`}
                    style={{ width: `${Math.abs(row.meanChange) / maxChange * 50}%`, ...(row.meanChange < 0 ? { right: "50%" } : { left: "50%" }) }} />
                </div>}
                <p className="text-sm">{row.comparable} de {row.participants} comparables · {row.improved} subieron</p>
              </div>)}
            </div>
          </section>
          <section className={card}>
            <h2 className="text-xl font-bold">Entrenamientos completados por día</h2>
            <div className="flex items-end gap-0.5 h-32" aria-hidden="true">
              {timeline.map(row => <div key={row.day} className="flex flex-1 h-full items-end" title={`${date(row.day)} · ${row.completed}`}>
                <span className={`w-full rounded-t ${row.completed ? "bg-brand" : "bg-slate-400/30"}`} style={{ height: row.completed ? `${row.completed / maxActivity * 100}%` : "2px" }} />
              </div>)}
            </div>
            <div className="flex justify-between text-xs"><span>{date(report.from)}</span><span>{date(report.to)}</span></div>
            <details><summary className="cursor-pointer text-accent">Ver actividad diaria</summary>
              <ul className="mt-2 max-h-48 overflow-auto text-sm">
                {timeline.map(row => <li key={row.day}>{date(row.day)} · {row.completed} completadas</li>)}
              </ul>
            </details>
          </section>
          <section className={card}>
            <h2 className="text-xl font-bold">Desempeño por ejercicio</h2>
            {report.exercises.length === 0 ? <p>Sin intentos en entrenamientos completados.</p> :
              <div className="overflow-auto"><table className="w-full text-sm">
                <thead><tr>{["Ejercicio", "Intentos", "Precisión media", "Tiempo mediano"].map(label => <th key={label} scope="col" className={cell}>{label}</th>)}</tr></thead>
                <tbody>{report.exercises.map(row => <tr key={row.code} className="border-t border-slate-400/25">
                  <th scope="row" className={cell}>{row.name}</th><td className={cell}>{row.attempts}</td>
                  <td className={cell}>{percent(row.accuracy, 1)}</td><td className={cell}>{number.format(row.medianMs / 1000)} s</td>
                </tr>)}</tbody>
              </table></div>}
          </section>
        </>}
      </>}
    </div>
  </main>;
}

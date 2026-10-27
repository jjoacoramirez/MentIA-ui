import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useJourney, categories } from "../context/JourneyContext";
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
export function AuthScreen({
  mode,
}: {
  mode: "registro" | "ingreso" | "recuperacion";
}) {
  const { setCurrentTab } = useApp();
  const { enter } = useJourney();
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [age, setAge] = useState("18-24");
  const [code, setCode] = useState("");
  const [issued, setIssued] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[a-z0-9_.]{3,30}$/.test(alias.trim().toLowerCase()))
      return setError(
        "Usá un alias de 3 a 30 caracteres: letras, números, punto o guion bajo.",
      );
    if (password.length < 10 || new TextEncoder().encode(password).length > 72)
      return setError(
        "La contraseña debe tener al menos 10 caracteres y hasta 72 bytes.",
      );
    if (mode !== "ingreso" && password !== repeat)
      return setError("Las contraseñas no coinciden.");
    if (mode === "recuperacion" && !code.trim())
      return setError("Ingresá un código para simular la recuperación.");
    if (mode === "ingreso") enter(alias.trim().toLowerCase());
    else {
      setIssued(`DEMO-${crypto.randomUUID().toUpperCase()}`);
      setPassword("");
      setRepeat("");
      setCode("");
    }
  }
  if (issued)
    return (
      <Panel title="Guardá tu código">
        <section className="flow-card">
          <p>
            Este código de ejemplo se muestra una sola vez en este recorrido. La
            cuenta y la recuperación todavía son simuladas.
          </p>
          <code className="block break-all my-4 select-all">{issued}</code>
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={saved}
              onChange={(e) => setSaved(e.target.checked)}
            />
            Ya guardé el código
          </label>
          <button
            className="flow-primary mt-4"
            disabled={!saved}
            onClick={() =>
              mode === "registro"
                ? enter(alias.trim().toLowerCase(), age)
                : setCurrentTab("ingreso")
            }
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
        Demo sin cuentas reales. Las credenciales no se guardan ni se validan
        contra un servidor. Al recargar se reinicia el recorrido.
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
            <select value={age} onChange={(e) => setAge(e.target.value)}>
              {["18-24", "25-30", "31-40", "41+"].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
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
            minLength={10}
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
        <button className="flow-primary" type="submit">
          {mode === "ingreso"
            ? "Entrar a la demo"
            : mode === "registro"
              ? "Crear cuenta de ejemplo"
              : "Simular restablecimiento"}
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
  const { minutes, goals, configure, assessed } = useJourney();
  const { setCurrentTab } = useApp();
  const [duration, setDuration] = useState(minutes);
  const [selected, setSelected] = useState(goals);
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
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            {[5, 10, 15, 20, 25, 30].map((n) => (
              <option key={n} value={n}>
                {n} minutos
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="mb-3">Áreas de entrenamiento</legend>
          {categories.map((c) => (
            <label className="flex gap-3 mb-3" key={c.code}>
              <input
                type="checkbox"
                checked={selected.includes(c.code)}
                onChange={() =>
                  setSelected((p) =>
                    p.includes(c.code)
                      ? p.filter((x) => x !== c.code)
                      : [...p, c.code],
                  )
                }
              />
              {c.name}
            </label>
          ))}
        </fieldset>
        <button className="flow-primary" disabled={!selected.length}>
          Guardar y continuar
        </button>
        {assessed && (
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
  const { assessed, minutes, begin } = useJourney();
  return (
    <Panel title={assessed ? "Preparar entrenamiento" : "Evaluación inicial"}>
      <section className="flow-card">
        <p className="text-lg font-bold mb-3">
          {assessed ? "Una sesión a tu ritmo" : "Tu punto de partida"}
        </p>
        <p>
          La evaluación inicial sirve para configurar el entrenamiento dentro de
          MentIA. Los resultados describen tu desempeño en la plataforma.
        </p>
        <p className="mt-4">
          Preferencia: {minutes} minutos. En esta demo vas a probar tres
          secuencias visuales breves; todavía no representan la evaluación
          completa ni las categorías definitivas.
        </p>
        <ol className="list-decimal pl-5 my-5 space-y-2">
          <li>Observá la secuencia de símbolos.</li>
          <li>Repetila en el mismo orden.</li>
          <li>Al terminar, revisá tus aciertos y tiempos.</li>
        </ol>
        <button className="flow-primary" onClick={() => begin(!assessed)}>
          {assessed
            ? "Comenzar sesión de ejemplo"
            : "Comenzar evaluación de ejemplo"}
        </button>
      </section>
    </Panel>
  );
}
export function ResultsScreen() {
  const { selected, assessed } = useJourney();
  const { setCurrentTab } = useApp();
  if (!selected)
    return (
      <Panel title="Resultados">
        <p>Todavía no seleccionaste una sesión.</p>
      </Panel>
    );
  return (
    <Panel
      title={
        selected.type === "INITIAL_ASSESSMENT"
          ? "Evaluación completada"
          : "Resultado de sesión"
      }
    >
      <section className="flow-card">
        <p className="mb-4">
          Resultado del ejercicio provisional de secuencias visuales.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Metric
            label="Aciertos"
            value={`${selected.correctCount}/${selected.itemsCompleted}`}
          />
          <Metric
            label="Precisión"
            value={`${Math.round(selected.accuracy * 100)}%`}
          />
          <Metric
            label="Tiempo"
            value={`${Math.round(selected.totalTimeMs / 1000)} s`}
          />
          <Metric label="XP de ejemplo" value={`+${selected.xpEarned}`} />
        </div>
        <p className="mt-5 text-sm">
          La adaptación de dificultad y los resultados por categoría se
          incorporarán con el motor del backend y los ejercicios definitivos.
        </p>
      </section>
      <button
        className="flow-primary mt-5"
        onClick={() => setCurrentTab(assessed ? "inicio" : "evaluacion")}
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
export function HistoryScreen() {
  const { history, select } = useJourney();
  const [filter, setFilter] = useState("ALL");
  return (
    <Panel title="Historial">
      <label>
        Mostrar
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="ALL">Todas las sesiones</option>
          <option value="COMPLETED">Completadas</option>
          <option value="ABANDONED">Abandonadas</option>
        </select>
      </label>
      <div className="mt-4 space-y-3">
        {!history.filter((r) => filter === "ALL" || r.status === filter)
          .length && (
          <p className="flow-card">
            No hay sesiones para este filtro. Comenzá desde Entrenar.
          </p>
        )}
        {history
          .filter((r) => filter === "ALL" || r.status === filter)
          .map((r) => (
            <button
              className="flow-card w-full text-left"
              key={r.id}
              disabled={r.status === "ABANDONED"}
              onClick={() => select(r)}
            >
              <strong className="block">
                {r.type === "INITIAL_ASSESSMENT"
                  ? "Evaluación inicial"
                  : "Entrenamiento"}{" "}
                · {r.status === "COMPLETED" ? "Completada" : "Abandonada"}
              </strong>
              <span className="block text-sm mt-2">
                {new Date(r.finishedAt).toLocaleString("es-AR")} ·{" "}
                {r.itemsCompleted} intentos
              </span>
              {r.status === "COMPLETED" && (
                <span className="flow-link">
                  Ver resultado · {Math.round(r.accuracy * 100)}%
                </span>
              )}
            </button>
          ))}
      </div>
    </Panel>
  );
}
export function AchievementsScreen() {
  const { history } = useJourney();
  const completed = history.filter((r) => r.status === "COMPLETED");
  const achievements = [
    [
      "Primer paso",
      "Completá la evaluación de ejemplo.",
      completed.some((r) => r.type === "INITIAL_ASSESSMENT"),
    ],
    [
      "En movimiento",
      "Completá tres sesiones de ejemplo.",
      completed.length >= 3,
    ],
    [
      "Una nueva sesión",
      "Completá un entrenamiento de ejemplo.",
      completed.some((r) => r.type === "TRAINING"),
    ],
  ];
  return (
    <Panel title="Tus logros">
      <p className="mb-4">
        Condiciones de demostración; las reglas definitivas vendrán del backend.
      </p>
      <div className="space-y-3">
        {achievements.map(([title, description, unlocked]) => (
          <section className="flow-card" key={String(title)}>
            <strong>
              {unlocked ? "★" : "☆"} {title}
            </strong>
            <p className="text-sm mt-2">{description}</p>
            <span className="text-cyan-700 dark:text-cyan-300 text-sm">
              {unlocked ? "Obtenido" : "Por descubrir"}
            </span>
          </section>
        ))}
      </div>
    </Panel>
  );
}

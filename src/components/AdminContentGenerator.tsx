import React, { useState } from "react";
import { ApiError, mentiaApi, type GenerateContentResult, type GeneratableType } from "../services/api";

const TYPES: { value: GeneratableType; label: string }[] = [
  { value: "VISUAL_RECOGNITION", label: "Reconocimiento visual (temas de imágenes)" },
  { value: "REVERSE_SEQUENCE", label: "Secuencia inversa (símbolos)" },
  { value: "N_BACK", label: "N-back (símbolos)" },
];

const STOPPED: Record<NonNullable<GenerateContentResult["stoppedReason"]>, string> = {
  LIMIT_EXCEEDED: "se alcanzó el límite de gasto de IA",
  CIRCUIT_OPEN: "el proveedor de IA está en pausa por fallas recientes",
  PROVIDER_ERROR: "el proveedor de IA falló",
  DISABLED: "la IA está desactivada",
};

/** Resumen del lote en palabras. */
export function describeGeneration(result: GenerateContentResult): string {
  const parts: string[] = [];
  const n = result.created.length;
  parts.push(n ? `Se ${n === 1 ? "creó 1 variante nueva" : `crearon ${n} variantes nuevas`}.` : "No se creó ninguna variante.");
  if (result.rejected) parts.push(`${result.rejected} ${result.rejected === 1 ? "no pasó" : "no pasaron"} la validación y se descartó.`);
  if (result.stoppedReason) parts.push(`Se cortó antes de terminar: ${STOPPED[result.stoppedReason]}.`);
  return parts.join(" ");
}

/**
 * Pide a la IA variantes de contenido nuevas. El servidor las valida de forma estricta y las guarda marcadas como
 * generadas por IA. Cada variante es una llamada y cuenta en el presupuesto global de IA.
 */
export function AdminContentGenerator({ token }: { token: string }) {
  const [type, setType] = useState<GeneratableType>("VISUAL_RECOGNITION");
  const [count, setCount] = useState(2);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<GenerateContentResult | null>(null);
  const [error, setError] = useState("");

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    setError("");
    try {
      setResult(await mentiaApi.generateContent(token, type, count));
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "No pudimos generar el contenido. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flow-card space-y-3" aria-label="Generar contenido con IA">
      <h2 className="text-xl font-bold">Generar contenido con IA</h2>
      <p className="text-sm opacity-80">
        Pide variantes nuevas (temas de imágenes o conjuntos de símbolos) para que los ejercicios no se repitan tanto.
        Cada una se valida antes de guardarse y queda marcada como generada por IA. Cada variante cuenta en el límite de
        gasto de IA.
      </p>
      <form className="flex flex-wrap items-end gap-3" onSubmit={generate}>
        <label className="flex-1 min-w-56">
          Ejercicio
          <select className="w-full rounded-xl border border-slate-400/40 bg-canvas px-3 py-2 text-ink" value={type}
            onChange={(e) => setType(e.target.value as GeneratableType)}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label>
          Cantidad
          <select className="w-full rounded-xl border border-slate-400/40 bg-canvas px-3 py-2 text-ink" value={count}
            onChange={(e) => setCount(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <button className="flow-primary" disabled={busy}>{busy ? "Generando…" : "Generar"}</button>
      </form>
      {result && (
        <div role="status">
          <p>{describeGeneration(result)}</p>
          {result.created.length > 0 && (
            <ul className="mt-2 text-sm list-disc pl-5">
              {result.created.map((c) => <li key={c.variantKey}>{c.theme}{c.active ? "" : " (inactiva: falta revisarla)"}</li>)}
            </ul>
          )}
        </div>
      )}
      {error && <p role="alert" className="text-rose-600 dark:text-rose-300">{error}</p>}
    </section>
  );
}

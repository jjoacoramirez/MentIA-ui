import { useEffect, useRef, useState } from "react";
import type { SessionItem } from "../services/api";

/** Resultado de un ítem, tal como se reporta al servidor (que no lo recalcula). */
export interface GameOutcome {
  isCorrect: boolean;
  accuracy: number;
  responseTimeMs: number;
  response?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
}

export interface GameProps {
  item: SessionItem;
  paused: boolean;
  onDone: (outcome: GameOutcome) => void;
}

/**
 * Generador determinístico (mulberry32): con el mismo seed del servidor se generan los mismos estímulos.
 * El seed es int64; alcanza con sus 32 bits bajos.
 */
export function seededRandom(seed: number) {
  let state = Number(BigInt.asUintN(32, BigInt(Math.trunc(seed)))) || 1;
  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (max: number) => Math.floor(next() * max),
    pick: <T,>(list: readonly T[]) => list[Math.floor(next() * list.length)],
    shuffle: <T,>(list: readonly T[]) => {
      const copy = [...list];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
  };
}

type Random = ReturnType<typeof seededRandom>;

/**
 * `rounds` posiciones de 0 a `count - 1`, sin repetir hasta haber usado todas y sin que dos rondas seguidas caigan en
 * el mismo lugar (aunque `count` sea menor a `rounds`, y también al empezar una vuelta nueva).
 */
export function spreadPicks(random: Random, count: number, rounds: number): number[] {
  const picks: number[] = [];
  let bag: number[] = [];
  while (picks.length < rounds) {
    if (bag.length === 0) {
      bag = random.shuffle(Array.from({ length: count }, (_, i) => i));
      if (count > 1 && bag[0] === picks[picks.length - 1]) bag.push(bag.shift()!);
    }
    picks.push(bag.shift()!);
  }
  return picks;
}

/** Elige al azar uno de `pool` que no esté en `avoid`; si no queda ninguno, elige cualquiera. */
export function pickAvoiding<T>(random: Random, pool: readonly T[], avoid: readonly (T | undefined)[]): T {
  const allowed = pool.filter((item) => !avoid.includes(item));
  return random.pick(allowed.length ? allowed : pool);
}

export const num = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
export const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

export const TICK_MS = 100;

/**
 * Cuenta regresiva que se detiene en pausa. Llama a onEnd una sola vez al llegar a 0.
 * Cambiar `key` la reinicia.
 */
export function useCountdown(ms: number, active: boolean, paused: boolean, onEnd: () => void, key: unknown = 0) {
  // La clave viaja con el tiempo restante: al cambiar de ronda, un 0 de la ronda anterior no vuelve a disparar onEnd.
  const [state, setState] = useState({ key, remaining: ms });
  const end = useRef(onEnd);
  end.current = onEnd;
  const fired = useRef<unknown>(Symbol());
  const current = state.key === key ? state.remaining : ms;
  useEffect(() => {
    if (state.key !== key) setState({ key, remaining: ms });
  }, [key, ms, state.key]);
  useEffect(() => {
    if (!active || paused) return;
    const timer = setInterval(
      () => setState((s) => (s.key === key ? { key, remaining: Math.max(0, s.remaining - TICK_MS) } : s)),
      TICK_MS,
    );
    return () => clearInterval(timer);
  }, [active, paused, key]);
  useEffect(() => {
    if (active && state.key === key && state.remaining <= 0 && fired.current !== key) {
      fired.current = key;
      end.current();
    }
  }, [state, active, key]);
  return current;
}

/** Tiempo activo (sin contar pausas) desde que `running` pasa a true. */
export function useActiveClock(running: boolean, paused: boolean) {
  const elapsed = useRef(0);
  useEffect(() => {
    if (!running || paused) return;
    const timer = setInterval(() => (elapsed.current += TICK_MS), TICK_MS);
    return () => clearInterval(timer);
  }, [running, paused]);
  return elapsed;
}

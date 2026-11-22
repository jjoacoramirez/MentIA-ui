import type { ExerciseType, SessionItem } from "../services/api";

export interface DemoTile { text: string; selected?: boolean; color?: string }
export interface DemoFrame {
  title: string;
  caption: string;
  tiles: DemoTile[];
  grid?: boolean;
  action?: string;
}
export interface Tutorial { summary: string; frames: DemoFrame[] }
const tiles = (values: string[], selected: number[] = []): DemoTile[] => values.map((text, i) => ({ text, selected: selected.includes(i) }));

/** Ejemplos independientes: nunca usan el seed ni las respuestas de la actividad real. */
export function tutorialFor(item: Pick<SessionItem, "exerciseType" | "params">): Tutorial {
  const type = item.exerciseType;
  if (type === "N_BACK") {
    const value = Number(item.params.n ?? 1);
    const n = Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
    const previous = Array.from({ length: n }, (_, i) => String.fromCharCode(65 + (i % 24)));
    const comparison = n === 1 ? "el anterior" : `el de ${n} lugares atrás`;
    return {
      summary: `Compará cada símbolo con ${comparison}. Tocá «Coincide» solo si son iguales. Si son distintos, esperá sin tocar nada.`,
      frames: [
        ...previous.map((symbol, i): DemoFrame => ({ title: `Primero, memorizá · ${i + 1} de ${n}`, caption: "Aparecen de a uno. Todavía no hay suficientes símbolos para comparar.", tiles: tiles([symbol]) })),
        { title: "Ahora sí, compará", caption: `A coincide con ${comparison}: A. Tocá «Coincide». Los símbolos anteriores se muestran acá solo como ayuda.`, tiles: tiles([...previous, "A"], [0, n]), action: "Coincide ✓" },
        { title: "Si son distintos, esperá", caption: `Ahora aparece Z. No coincide con ${n === 1 ? "el anterior (A)" : `el de ${n} lugares atrás (${previous[1]})`}. No toques «Coincide»: esperá el siguiente.`, tiles: tiles([...previous, "A", "Z"]), action: "Esperá sin tocar" },
      ],
    };
  }
  if (type === "REVERSE_SEQUENCE" || type === "AUDITORY_SEQUENCE") {
    const reverse = type === "REVERSE_SEQUENCE";
    const answer = reverse ? ["★", "●", "◆"] : ["◆", "●", "★"];
    return {
      summary: reverse
        ? "Mirá los símbolos que aparecen de a uno. Cuando termine la secuencia, elegilos al revés: del último al primero. Después confirmá."
        : "En esta versión la secuencia es visual, sin audio. Mirá los símbolos de a uno y después elegilos en el mismo orden. Al terminar, confirmá.",
      frames: [
        ...["◆", "●", "★"].map((symbol, i): DemoFrame => ({ title: `Mirá el símbolo ${i + 1} de 3`, caption: "Recordá el orden. Durante esta parte todavía no respondés.", tiles: tiles([symbol]) })),
        ...answer.map((symbol, i): DemoFrame => ({
          title: `Tu turno · elegí ${symbol}`,
          caption: i === 2 ? `La respuesta queda ${answer.join(" → ")}. Ya completaste todos los lugares: confirmá. Podés usar «Deshacer» si te equivocás.` : reverse ? `Viste ◆, ●, ★. Respondé desde el último al primero. Ahora tocá ${symbol}.` : `Viste ◆, ●, ★. Respondé en el mismo orden. Ahora tocá ${symbol}.`,
          tiles: tiles(answer.map((value, index) => index <= i ? value : "·"), Array.from({ length: i + 1 }, (_, index) => index)),
          action: i === 2 ? "Confirmar respuesta" : `Toque en ${symbol}`,
        })),
      ],
    };
  }
  const tutorials: Record<Exclude<ExerciseType, "N_BACK" | "REVERSE_SEQUENCE" | "AUDITORY_SEQUENCE">, Tutorial> = {
    VISUAL_RECOGNITION: {
      summary: "Memorizá las imágenes. Después aparecerán mezcladas con otras: marcá solo las que viste antes y confirmá tu selección.",
      frames: [
        { title: "1. Memorizá", caption: "En este ejemplo, recordá la manzana y la bicicleta.", tiles: tiles(["🍎", "🚲"]) },
        { title: "2. Buscá las que viste", caption: "Ahora hay imágenes nuevas mezcladas con las anteriores.", tiles: tiles(["🚲", "🌻", "🍎", "⚽"]) },
        { title: "3. Marcá y confirmá", caption: "Seleccioná la bicicleta y la manzana. Dejá las otras sin marcar. Podés tocar otra vez una imagen para desmarcarla.", tiles: tiles(["🚲", "🌻", "🍎", "⚽"], [0, 2]), action: "Confirmar selección" },
      ],
    },
    SPATIAL_GRID: {
      summary: "Recordá qué casillas se encienden. Cuando se apaguen, marcá esas mismas posiciones y confirmá. El orden no importa.",
      frames: [
        { title: "1. Memorizá las posiciones", caption: "Se encienden tres casillas. Fijate dónde están.", tiles: tiles(Array(9).fill(""), [0, 4, 8]), grid: true },
        { title: "2. Las luces se apagan", caption: "Ahora te toca recordar las posiciones.", tiles: tiles(Array(9).fill("")), grid: true },
        { title: "3. Marcá las mismas casillas", caption: "En este ejemplo, elegí la esquina superior izquierda, el centro y la esquina inferior derecha. Después confirmá.", tiles: tiles(Array(9).fill(""), [0, 4, 8]), grid: true, action: "Confirmar" },
      ],
    },
    ODD_ONE_OUT: {
      summary: "Buscá el único elemento distinto y tocalo antes de que se termine el tiempo. Cada toque pasa a la siguiente ronda: no hace falta confirmar.",
      frames: [
        { title: "1. Buscá el distinto", caption: "Casi todos son círculos. Hay uno con otra forma.", tiles: tiles(["●", "●", "●", "◆", "●", "●"]) },
        { title: "2. Tocá el rombo", caption: "El rombo es el único diferente. Al tocarlo, respondés esta ronda.", tiles: tiles(["●", "●", "●", "◆", "●", "●"], [3]), action: "Toque en ◆ ✓" },
        { title: "3. Buscá otra vez", caption: "En la siguiente ronda cambia la ubicación. Volvé a buscar el distinto.", tiles: tiles(["●", "◆", "●", "●", "●", "●"], [1]) },
      ],
    },
    STROOP: {
      summary: "Elegí el color con el que está pintada la palabra. Ignorá lo que dice. Respondé antes de que se termine el tiempo: cada toque pasa a la siguiente palabra.",
      frames: [
        { title: "1. Mirá el color de la tinta", caption: "La palabra dice ROJO, pero está pintada de azul.", tiles: [{ text: "ROJO", color: "#2563eb" }] },
        { title: "2. Elegí «azul»", caption: "La respuesta es azul porque ese es el color de las letras.", tiles: [{ text: "ROJO", color: "#2563eb" }], action: "azul ✓" },
        { title: "3. Aplicá la misma regla", caption: "Ahora dice AZUL y la tinta es roja. Elegí «rojo».", tiles: [{ text: "AZUL", color: "#e53935" }], action: "rojo ✓" },
      ],
    },
  };
  return tutorials[type];
}

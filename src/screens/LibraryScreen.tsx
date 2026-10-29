import React from "react";
import { Brain, Focus, Layers, LockKeyhole, Play } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useJourney } from "../context/JourneyContext";
import { memoryProgress, SESSIONS_TO_ADVANCE } from "../domain/training";
import { Panel } from "./FlowScreens";
export function LibraryScreen() {
  const { history, canTrain, begin } = useJourney();
  const { setCurrentTab } = useApp();
  const progress = memoryProgress(history);
  return <Panel title="Biblioteca de juegos">
    <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">Elegí qué practicar. MentIA asigna la dificultad según tu progreso en cada área, independientemente de tu nivel general de XP.</p>
    {!canTrain && <section className="flow-card mb-4"><h2 className="font-bold mb-2">Primero, tu punto de partida</h2><p className="text-sm mb-4">Completá la evaluación inicial para comenzar a entrenar.</p><button className="flow-primary" onClick={() => setCurrentTab("evaluacion")}>Ir a evaluación inicial</button></section>}
    <div className="library-grid">
    <section className="flow-card library-feature mb-4">
      <div className="flex items-center justify-between mb-4"><Brain className="text-accent"/><span className="status-badge completed">Memoria · Nivel {progress.level}</span></div>
      <h2 className="font-space text-xl font-bold">Secuencias visuales</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 mb-5">Memorizá los símbolos y repetí su orden. Tu próximo desafío tiene {progress.objects} objetos.</p>
      <ol className="level-path" aria-label="Progresión de memoria">
        {[1,2,3].map(level => <li key={level} className={level === progress.level ? "current" : level > progress.level ? "locked" : "complete"}>
          <span className="flex justify-center gap-1 items-center font-bold">{level > progress.level && <LockKeyhole size={12} aria-hidden="true"/>}Nivel {level}</span>
          <span>{level + 3} objetos</span>
          <span className="text-[10px]">{level === progress.level ? "Tu nivel" : level > progress.level ? "Bloqueado" : "Superado"}</span>
        </li>)}
      </ol>
      <p className="text-xs text-slate-600 dark:text-slate-300 my-4">{progress.level < 3 ? `${progress.successes}/${SESSIONS_TO_ADVANCE} sesiones consecutivas con al menos 80 % de precisión para avanzar al siguiente nivel.` : "Alcanzaste el último nivel de esta demo. Podés seguir practicando con 6 objetos."} La dificultad cambia entre sesiones, nunca en medio de una partida.</p>
      <button className="flow-primary flex! items-center justify-center gap-2" disabled={!canTrain} onClick={() => begin(false)}><Play size={16} aria-hidden="true"/>Jugar en mi nivel</button>
    </section>
    {[{name:"Atención",game:"Búsqueda de estímulos",Icon:Focus},{name:"Memoria de trabajo",game:"Actualización de secuencias",Icon:Layers}].map(({name,game,Icon}) => <section className="flow-card mb-4" key={name}>
      <div className="flex items-center justify-between mb-3"><Icon className="text-slate-500 dark:text-slate-300"/><span className="status-badge abandoned">Próximamente</span></div>
      <p className="text-xs text-accent mb-1">{name} · sin evaluar</p><h2 className="font-space font-bold text-lg">{game}</h2><p className="text-sm text-slate-600 dark:text-slate-300 mt-2">La mecánica y los niveles de esta área todavía están pendientes. El progreso de Memoria no desbloquea estas áreas.</p>
    </section>)}
    </div>
    <p className="text-xs text-slate-500 dark:text-slate-400">Regla provisional para probar el recorrido: niveles 1–3 y avance tras dos sesiones de entrenamiento consecutivas con al menos 80 % de precisión. El backend deberá validar y guardar esta progresión.</p>
  </Panel>;
}

import { describe, expect, it } from "vitest";
import { memoryProgress, streakDays, type TrainingRecord } from "../src/domain/training";
const session = (level = 1, extra: Partial<TrainingRecord> = {}): TrainingRecord => ({ status:"COMPLETED", type:"TRAINING", accuracy:1, itemsCompleted:3, finishedAt:"2026-10-27T15:00:00Z", category:"MEMORIA", difficultyLevel:level, ...extra });
describe("Dificultad por área", () => {
  it("empieza con cuatro objetos y no salta niveles por XP o por evaluación", () => {
    expect(memoryProgress([])).toMatchObject({ level:1, objects:4 });
    expect(memoryProgress([session(3), session(1,{type:"INITIAL_ASSESSMENT"}), session(1,{category:"ATENCION"})])).toMatchObject({level:1,successes:0});
  });
  it("avanza gradualmente de cuatro a cinco y seis objetos", () => {
    const history = [session(), session()];
    expect(memoryProgress(history)).toMatchObject({level:2,objects:5,successes:0});
    history.unshift(session(2));
    expect(memoryProgress(history)).toMatchObject({level:2,successes:1});
    history.unshift(session(2));
    expect(memoryProgress(history)).toMatchObject({level:3,objects:6});
    history.unshift(session(3),session(3),session(3));
    expect(memoryProgress(history).level).toBe(3);
  });
  it("no avanza al abandonar ni con sesiones parciales y reinicia la serie ante un resultado bajo", () => {
    expect(memoryProgress([session(1,{status:"ABANDONED"}), session(1,{itemsCompleted:1}), session()])).toMatchObject({level:1,successes:0});
    expect(memoryProgress([session(), session(1,{accuracy:.67}),session()])).toMatchObject({level:1,successes:1});
  });
});
describe("Racha", () => {
  it("cuenta días consecutivos de Argentina sin duplicar sesiones ni incluir abandonos", () => {
    const now = new Date("2026-10-28T01:00:00Z"); // Todavía 27/10 en Argentina.
    const history = [session(),session(),session(1,{finishedAt:"2026-10-26T15:00:00Z"}),session(1,{finishedAt:"2026-10-25T15:00:00Z",status:"ABANDONED"})];
    expect(streakDays(history,now)).toBe(2);
    expect(streakDays(history,new Date("2026-10-28T15:00:00Z"))).toBe(2);
    expect(streakDays(history,new Date("2026-10-29T15:00:00Z"))).toBe(0);
  });
});

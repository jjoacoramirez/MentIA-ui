import { describe, expect, it } from "vitest";
import { progressChange } from "../src/components/LevelProgress";

describe("Progreso dentro del nivel", () => {
  it("describe el cambio de una sesión", () => {
    expect(progressChange(4, 5, 75, 50)).toBe("¡Subiste al nivel 5!");
    expect(progressChange(4, 3, 25, 50)).toBe("Volvés al nivel 3 para afianzar");
    expect(progressChange(4, 4, 50, 75)).toBe("+25 puntos en el nivel");
    expect(progressChange(4, 4, 50, 25)).toBe("-25 puntos en el nivel");
    expect(progressChange(4, 4, 50, 50)).toBe("Sin cambios en el nivel");
    expect(progressChange(3, 3, null, 50)).toBeNull();
  });
});

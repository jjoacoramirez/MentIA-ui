import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useVisibleViewport } from "../src/hooks/useVisibleViewport";

it("mantiene el marco dentro del área visible y se actualiza cuando cambia", () => {
  const viewport = Object.assign(new EventTarget(), { height: 700, scale: 1 });
  vi.stubGlobal("visualViewport", viewport);
  const { unmount } = renderHook(useVisibleViewport);
  expect(document.documentElement.style.getPropertyValue("--mentia-visible-height")).toBe("700px");
  act(() => { viewport.height = 480; viewport.dispatchEvent(new Event("resize")); });
  expect(document.documentElement.style.getPropertyValue("--mentia-visible-height")).toBe("480px");
  act(() => { viewport.scale = 2; viewport.height = 240; viewport.dispatchEvent(new Event("resize")); });
  expect(document.documentElement.style.getPropertyValue("--mentia-visible-height")).toBe("480px");
  unmount();
  expect(document.documentElement.style.getPropertyValue("--mentia-visible-height")).toBe("");
  vi.unstubAllGlobals();
});

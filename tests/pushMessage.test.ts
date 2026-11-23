import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";

const source = readFileSync("public/sw.js", "utf8");
async function receive(data?: { json: () => unknown }) {
  const events: Record<string, (event: unknown) => void> = {};
  const notify = vi.fn(async () => undefined);
  const self = { addEventListener: (name: string, fn: (event: unknown) => void) => { events[name] = fn; }, registration: { showNotification: notify } };
  runInNewContext(source, { self, URL });
  let completion: Promise<unknown> | undefined;
  events.push({ data, waitUntil: (promise: Promise<unknown>) => { completion = promise; } });
  await completion;
  return notify;
}
it("si el servidor informa racha activa invita a mantenerla", async () => {
  const notify = await receive({ json: () => ({ kind: "streak" }) });
  expect(notify).toHaveBeenCalledWith("¡Seguí con tu racha!", expect.objectContaining({ body: expect.stringContaining("mantené tu racha") }));
});
it("si el servidor informa cero racha invita a empezar", async () => {
  const notify = await receive({ json: () => ({ kind: "start" }) });
  expect(notify).toHaveBeenCalledWith("¡Empezá a entrenar!", expect.objectContaining({ body: expect.stringContaining("primer paso") }));
});
it("los avisos anteriores sin datos y los inválidos siguen mostrando un texto general", async () => {
  for (const data of [undefined, { json: () => { throw new Error(); } }, { json: () => ({ kind: "unknown" }) }]) {
    const notify = await receive(data);
    expect(notify).toHaveBeenCalledWith("Un momento para tu mente", expect.objectContaining({ tag: "streak-reminder" }));
  }
});

import React, { createContext, useContext, useEffect, useState } from "react";

type InstallPrompt = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
const InstallContext = createContext<{
  prompt: InstallPrompt | null;
  installed: boolean;
  clear: () => void;
}>({ prompt: null, installed: false, clear: () => {} });

export function InstallAppProvider({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const detect = () => setInstalled(display.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const offer = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const complete = () => { setInstalled(true); setPrompt(null); };
    detect();
    window.addEventListener("beforeinstallprompt", offer);
    window.addEventListener("appinstalled", complete);
    display.addEventListener("change", detect);
    return () => {
      window.removeEventListener("beforeinstallprompt", offer);
      window.removeEventListener("appinstalled", complete);
      display.removeEventListener("change", detect);
    };
  }, []);
  return <InstallContext.Provider value={{ prompt, installed, clear: () => setPrompt(null) }}>{children}</InstallContext.Provider>;
}

export function InstallAppCard() {
  const { prompt, installed, clear } = useContext(InstallContext);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (installed) return null;
  async function install() {
    if (!prompt) return;
    setBusy(true);
    setError("");
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      setError("Abrí el menú del navegador y elegí instalar MentIA o agregarla a la pantalla de inicio.");
    } finally {
      clear();
      setBusy(false);
    }
  }
  return (
    <section className="flow-card mb-4">
      <div className="flex items-center gap-3 mb-3">
        <img src="/icons/icon-192.png" alt="" width="44" height="44" className="rounded-xl" />
        <h3 className="font-space font-bold">MentIA en tu dispositivo</h3>
      </div>
      <p className="text-sm mb-3">Agregá MentIA con su nombre y logo para abrirla desde tu computadora o celular.</p>
      {prompt ? <button className="flow-primary" disabled={busy} onClick={install}>{busy ? "Abriendo…" : "Instalar MentIA"}</button>
        : <p className="text-sm">En Chrome o Edge, abrí el menú y buscá la opción de instalar esta app. En iPhone o iPad, abrí MentIA en Safari y elegí Compartir → Agregar a inicio.</p>}
      {error && <p className="text-sm mt-2" role="alert">{error}</p>}
    </section>
  );
}

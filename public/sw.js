/*
 * Service worker de MentIA: muestra el recordatorio de entrenamiento, con o sin racha.
 * El servidor elige el tipo según la racha al enviar. Sin contenido, muestra un texto general compatible.
 * No guarda nada en caché ni intercepta
 * requests: la app funciona igual sin él.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let kind;
  try { kind = event.data?.json()?.kind; } catch { /* Compatibilidad con avisos anteriores. */ }
  const message = kind === "streak"
    ? { title: "¡Seguí con tu racha!", body: "Hoy todavía no entrenaste. Dedicá unos minutos a entrenar y mantené tu racha." }
    : kind === "start"
      ? { title: "¡Empezá a entrenar!", body: "Una sesión corta puede ser tu primer paso. Entrá a MentIA y empezá hoy." }
      : { title: "Un momento para tu mente", body: "Hoy podés dar el primer paso o seguir con tu hábito. Dedicá unos minutos a entrenar." };
  event.waitUntil(
    self.registration.showNotification(message.title, {
      body: message.body,
      tag: "streak-reminder",
      // Versionar las URLs permite refrescar íconos antiguos guardados por el navegador.
      icon: "/icons/icon-192.png?v=2",
      badge: "/icons/badge-96.png?v=2",
      actions: [{ action: "train", title: "Entrenar" }],
      data: { url: "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
      return open ? open.focus() : self.clients.openWindow(target);
    }),
  );
});

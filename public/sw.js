/*
 * Service worker de MentIA: solo muestra el recordatorio de racha.
 * El servidor manda el aviso sin contenido, así que el texto vive acá. No guarda nada en caché ni intercepta
 * requests: la app funciona igual sin él.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  event.waitUntil(
    self.registration.showNotification("Un momento para tu mente", {
      body: "Todavía estás a tiempo de entrenar hoy y mantener tu racha.",
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

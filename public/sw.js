/*
 * Service worker de MentIA: solo muestra el recordatorio de racha.
 * El servidor manda el aviso sin contenido, así que el texto vive acá. No guarda nada en caché ni intercepta
 * requests: la app funciona igual sin él.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  event.waitUntil(
    self.registration.showNotification("MentIA", {
      body: "Hoy todavía no entrenaste. Con unos minutos alcanzás para mantener tu racha.",
      tag: "streak-reminder",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
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

// Service Worker de Dosis: muestra las notificaciones push
// aunque la pestaña esté cerrada.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // payload no JSON
  }

  const title = data.title || "Dosis";
  const options = {
    body: data.body || "",
    icon: "/logo.png",
    badge: "/logo.png",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (windows) => {
        for (const win of windows) {
          if (win.url && win.url.startsWith(self.location.origin)) {
            return win.navigate(url).then(() => win.focus());
          }
        }
        return self.clients.openWindow(url);
      }
    )
  );
});

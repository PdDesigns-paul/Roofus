self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "Roofus", body: "Open the app.", url: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* keep default */
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Roofus", {
      body: data.body || "Open the app.",
      icon: "/icon-192.png",
      badge: "/icon-180.png",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ("focus" in c) {
          c.navigate?.(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

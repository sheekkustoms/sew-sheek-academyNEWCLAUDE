// SEW SHEEK - Service Worker for Push Notifications

const ICON_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ad18c269d65fade54e850d/fbce1e699_generated_image.png';

self.addEventListener('install', (event) => {
  console.log('[SW] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(self.clients.claim());
});

// ── Handle incoming push messages ──────────────────────────────────────────
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'SEW SHEEK', body: event.data.text() };
    }
  }

  const title = data.title || 'SEW SHEEK';
  const options = {
    body: data.body || 'You have a new notification',
    icon: ICON_URL,
    badge: ICON_URL,
    tag: data.id || 'sew-sheek-notif',
    data: {
      url: data.url || '/',
      post_id: data.post_id || null,
    },
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── Handle notification click ───────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

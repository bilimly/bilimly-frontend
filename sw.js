// ── BILIMPARK SERVICE WORKER ─────────────────────────────────
// Handles: caching, push notifications, background sync,
//          notification clicks, message from page

const CACHE_NAME = 'bilimpark-v3';
const API_BASE = 'https://bilimly-backend-0zbt.onrender.com';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/tutor-dashboard.html',
  '/messages.html',
  '/auth.js',
  '/manifest.json',
];

// ── INSTALL ───────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(err => console.warn('[SW] Cache addAll failed:', err))
  );
  self.skipWaiting();
});

// ── ACTIVATE ──────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH (cache-first for static, network-first for API) ─────
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Skip non-GET and cross-origin
  if (e.request.method !== 'GET') return;
  if (!url.startsWith(self.location.origin) && !url.startsWith(API_BASE)) return;

  // API calls: network only, never cache
  if (url.includes('/api/')) {
    e.respondWith(fetch(e.request).catch(() => new Response(JSON.stringify({ error: 'offline' }), {
      headers: { 'Content-Type': 'application/json' }
    })));
    return;
  }

  // Static assets: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// ── PUSH NOTIFICATIONS ────────────────────────────────────────
self.addEventListener('push', e => {
  let data = { title: 'Bilimpark', body: 'Новое уведомление' };
  try {
    data = e.data ? e.data.json() : data;
  } catch (_) {}

  e.waitUntil(
    self.registration.showNotification(data.title || 'Bilimpark', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'bilimpark',
      renotify: true,
      data: data.url ? { url: data.url } : { url: '/dashboard.html' },
    })
  );
});

// ── NOTIFICATION CLICK ────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const targetUrl = e.notification.data?.url || '/dashboard.html';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // If app already open, focus it and send message
      const existing = list.find(c =>
        c.url.includes('bilimpark.kg') || c.url.includes('localhost')
      );
      if (existing) {
        existing.focus();
        existing.postMessage({ type: 'OPEN_TAB', tab: 'messages' });
        return;
      }
      // Otherwise open new window
      return clients.openWindow(targetUrl);
    })
  );
});

// ── MESSAGE FROM PAGE ─────────────────────────────────────────
// Page can send: { type: 'SKIP_WAITING' } to force update
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

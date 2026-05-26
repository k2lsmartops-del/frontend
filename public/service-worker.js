// ========================================
// Service Worker — K2L SmartOPs Terrain
// Stratégie : Network First (API), Cache First (images/assets)
// Mise à jour contrôlée : pas de skipWaiting automatique (section 17)
// ========================================

const CACHE_VERSION = '1.0.1';
const CACHE_NAME = `k2l-static-v${CACHE_VERSION}`;
const API_CACHE = `k2l-api-v${CACHE_VERSION}`;
const IMAGE_CACHE = `k2l-images-v${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/logo.jpeg',
];

// ── Installation ─────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  // PAS de self.skipWaiting() ici — le SW attend en "waiting"
  // jusqu'à ce que l'utilisateur décide de mettre à jour (section 17)
});

// ── Activation ───────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => ![CACHE_NAME, API_CACHE, IMAGE_CACHE].includes(n))
          .map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// ── Message : skipWaiting contrôlé ───────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Interception des requêtes ────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorer les requêtes non-GET pour le cache
  if (event.request.method !== 'GET') return;

  // Ignorer les requêtes chrome-extension, etc.
  if (!url.protocol.startsWith('http')) return;

  if (url.pathname.startsWith('/api')) {
    // Ne JAMAIS cacher les endpoints d'auth (section 18)
    if (url.pathname.includes('/api/auth')) return;
    event.respondWith(networkFirstStrategy(event.request, API_CACHE));
  } else if (event.request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(event.request, IMAGE_CACHE));
  } else {
    event.respondWith(networkFirstStrategy(event.request, CACHE_NAME));
  }
});

// ── Stratégies ───────────────────────────

async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    // Section 18 : ne cacher que GET, ok, pas opaque, pas auth
    const shouldCache =
      request.method === 'GET' &&
      response.ok &&
      response.type !== 'opaque' &&
      !request.url.includes('/api/auth');

    if (shouldCache) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || (await caches.match('/offline.html'));
  }
}

async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
      // Section 19 : limiter la taille du cache images
      await trimCache(cacheName, 60);
    }
    return response;
  } catch {
    return new Response('', { status: 408 });
  }
}

// ── Utilitaires ──────────────────────────

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await Promise.all(
      keys.slice(0, keys.length - maxItems).map((k) => cache.delete(k))
    );
  }
}

// ── Background Sync ──────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(syncOfflineQueue());
  }
});

async function syncOfflineQueue() {
  // Placeholder — sera connecté au syncService existant si nécessaire
  console.log('[SW] Background sync triggered');
}

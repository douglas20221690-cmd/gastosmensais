const CACHE_NAME = 'financas-pwa-v1.6.0'; 
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png?v=3',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://unpkg.com/vue@3/dist/vue.global.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Instalação: Cacheia tudo que é essencial
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

// Estratégia: Stale-While-Revalidate (Entrega rápido, atualiza depois)
self.addEventListener('fetch', (event) => {
  // Ignora chamadas do Firebase Firestore (elas têm persistência própria do SDK)
  if (event.request.url.includes('firestore.googleapis.com')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
        }
        return networkResponse;
      }).catch(() => {});

      return cachedResponse || fetchPromise;
    })
  );
});

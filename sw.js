const CACHE_NAME = 'financas-pwa-v1.5.1-offline'; // Incrementado a versão para forçar atualização
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://unpkg.com/vue@3/dist/vue.global.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', (event) => {
  // Ignora chamadas do Firebase/API para não interferir na auth em tempo real
  if (event.request.url.includes('firestore') || 
      event.request.url.includes('googleapis') || 
      event.request.url.includes('firebase')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Retorna o cache se houver, ou busca na rede
      return cachedResponse || fetch(event.request);
    })
  );
});

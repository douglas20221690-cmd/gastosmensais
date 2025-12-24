const CACHE_NAME = 'financas-pwa-v1.5.2-instant'; // Versão atualizada para aplicar as melhorias
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://unpkg.com/vue@3/dist/vue.global.js'
];

// Instalação: Salva os arquivos essenciais imediatamente
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Pre-caching assets...');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação: Remove caches antigos e assume o controle das abas abertas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('Removendo cache antigo:', key);
          return caches.delete(key);
        }
      })
    ))
  );
  self.clients.claim();
});

// Estratégia de Busca: Stale-While-Revalidate
// Entrega do cache instantaneamente e atualiza em background
self.addEventListener('fetch', (event) => {
  // Ignora chamadas do Firebase/APIs (precisam de dados em tempo real)
  if (
    event.request.url.includes('firestore') || 
    event.request.url.includes('googleapis') || 
    event.request.url.includes('firebase') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        // Inicia a busca na rede para atualizar o cache
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Se a resposta for válida, guarda no cache para a próxima vez
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Se falhar a rede (offline), o cachedResponse já será retornado abaixo
        });

        // Retorna a resposta do cache imediatamente (se existir) ou espera a rede
        return cachedResponse || fetchPromise;
      });
    })
  );
});

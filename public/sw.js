// Service worker mínimo: só existe pra tornar o app instalável (PWA) e cachear o shell da app
// pra abrir mais rápido em visitas repetidas. NÃO garante uso 100% offline — a leitura/escrita
// no SQLite via wasm e a sincronização com Supabase continuam precisando de rede.
const CACHE = 'educador-fisico-shell-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))),
    ),
  );
  self.clients.claim();
});

// Stale-while-revalidate: responde do cache na hora (se tiver) e atualiza em segundo plano.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cacheado = await cache.match(event.request);
      const buscaRede = fetch(event.request)
        .then((resposta) => {
          if (resposta.ok) cache.put(event.request, resposta.clone());
          return resposta;
        })
        .catch(() => cacheado);
      return cacheado ?? buscaRede;
    }),
  );
});

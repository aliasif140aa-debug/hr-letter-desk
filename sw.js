/* Amilla HR Letters · offline helper.
   Shows the saved copy straight away and quietly fetches a fresh one, so a new version
   arrives the next time you open the app. Your staff data and letters live in the phone's
   own storage and are never touched by this file. Bump VERSION to force a clean reload. */
const VERSION = 'v2';
const CACHE = 'hr-letters-' + VERSION;
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'mobile.css', 'mobile.js', 'pwa.js',
  'xlsx.full.min.js', 'pdf-lib.min.js',
  'favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('hr-letters-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const fontHost = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !fontHost) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = req.mode === 'navigate' ? 'index.html' : req;
    const cached = await cache.match(key, { ignoreSearch: true });
    const fresh = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(key, res.clone()).catch(() => {});
      return res;
    }).catch(() => null);
    if (cached) { e.waitUntil(fresh); return cached; }
    const res = await fresh;
    if (res) return res;
    if (req.mode === 'navigate') { const home = await cache.match('index.html'); if (home) return home; }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  })());
});

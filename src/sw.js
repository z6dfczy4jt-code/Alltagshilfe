/* Offline-Speicher: Die App öffnet sich auch ohne Netz (z. B. im Keller bei der Kundschaft).
   Die Seite selbst kommt zuerst aus dem Netz, nur ohne Verbindung aus dem Speicher. */
const VERSION = '__VERSION__';
const DATEIEN = ['./', './index.html', './manifest.webmanifest', './assets/icon.svg', './assets/icon-180.png', './assets/icon-192.png',
  './assets/fonts/lora-500.woff', './assets/fonts/lora-600.woff', './assets/fonts/carlito-400.woff', './assets/fonts/carlito-700.woff'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((alle) => Promise.all(alle.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (e.request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('version.json')) {
    e.respondWith(fetch(e.request).then((antwort) => {
      if (antwort.ok && e.request.mode === 'navigate') { const kopie = antwort.clone(); caches.open(VERSION).then((c) => c.put('./index.html', kopie)); }
      return antwort;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then((t) => t || fetch(e.request)));
});

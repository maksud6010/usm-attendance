/* USM attendance — face asset cache (6.5c).
 * Caches ONLY the pinned face-api library and its model files (vendor/face-api/…), cache-first, in a cache
 * named after the pinned version. Never touches API calls (/exec), the page, descriptors or attendance data.
 * Changing FACE_CACHE (new library/model version or hash) makes the browser install this worker again;
 * activation then deletes every older usm-face-* cache. */
var FACE_CACHE = 'usm-face-1.7.13-v1';
var FACE_PATH = '/vendor/face-api/';

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('usm-face-') === 0 && k !== FACE_CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.indexOf(FACE_PATH) < 0) return;      // everything else: network as usual
  event.respondWith(caches.open(FACE_CACHE).then(function (cache) {
    return cache.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) cache.put(req, res.clone());
        return res;
      });
    });
  }));
});

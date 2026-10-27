/* USM attendance — face asset cache (6.5c).
 * Caches ONLY the pinned face-api library and its model files (vendor/face-api/…), cache-first, in a cache
 * named after the pinned version. Never touches API calls (/exec), the page, descriptors or attendance data.
 * Changing FACE_CACHE (new library/model version or hash) makes the browser install this worker again;
 * activation then deletes every older usm-face-* cache. */
var FACE_CACHE = 'usm-face-1.7.13-v2';
var FACE_PATH = '/vendor/face-api/';

var FACE_ASSETS = [
  'vendor/face-api/face-api.js',
  'vendor/face-api/model/tiny_face_detector_model-weights_manifest.json',
  'vendor/face-api/model/tiny_face_detector_model.bin',
  'vendor/face-api/model/face_landmark_68_model-weights_manifest.json',
  'vendor/face-api/model/face_landmark_68_model.bin',
  'vendor/face-api/model/face_recognition_model-weights_manifest.json',
  'vendor/face-api/model/face_recognition_model.bin'
];
self.addEventListener('install', function (event) {
  // Prime the fixed ML assets in the background. A failed asset must not prevent the app from installing;
  // the normal cache-first fetch path can retry it later.
  event.waitUntil(caches.open(FACE_CACHE).then(function (cache) {
    return Promise.all(FACE_ASSETS.map(function (p) {
      var u = new URL(p, self.registration.scope).toString();
      return fetch(u, { cache: 'reload' }).then(function (r) { if (r.ok) return cache.put(u, r.clone()); }).catch(function () {});
    }));
  }).then(function () { return self.skipWaiting(); }));
});
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

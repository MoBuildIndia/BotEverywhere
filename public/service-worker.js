var dataCacheName = 'BOTEVERYWHERE';
var cacheName = 'bot_everywhere';
var filesToCache = [
 '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/main.js',
  '/img/architecture.jpg',
  '/img/auto.png',
  '/img/bot.png',
  '/img/chatbot_value_chain.png',
  '/img/panorama-3094696_1920.jpg',
  '/img/pers.png',
  '/img/san-francisco.jpg',
  '/img/singapore.jpg',
  '/img/bot_new1.png',
  '/img/manifest.json',
  '/js/bootstrap.js',
  '/js/bootstrap.min.js',
  '/js/jquery-3.2.1.min.js',
  '/js/mdb.js',
  '/js/mdb.min.js',
  '/js/popper.min.js',
  '/css/bootstrap.css',
  '/css/bootstrap.min.css',
  '/css/mdb.css',
  '/css/mdb.min.css',
  '/font/roboto/Roboto-Bold.ttf',
  '/font/roboto/Roboto-Bold.woff',
  '/font/roboto/Roboto-Bold.woff2',
  '/font/roboto/Roboto-Light.ttf',
  '/font/roboto/Roboto-Light.woff',
  '/font/roboto/Roboto-Light.woff2',
  '/font/roboto/Roboto-Medium.ttf',
  '/font/roboto/Roboto-Medium.woff',
  '/font/roboto/Roboto-Medium.woff2',
  '/font/roboto/Roboto-Regular.ttf',
  '/font/roboto/Roboto-Regular.woff',
  '/font/roboto/Roboto-Regular.woff2',
  '/font/roboto/Roboto-Thin.ttf',
  '/font/roboto/Roboto-Thin.woff',
  '/font/roboto/Roboto-Thin.woff2',
];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName && key !== dataCacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  /*
   * Fixes a corner case in which the app wasn't returning the latest data.
   * You can reproduce the corner case by commenting out the line below and
   * then doing the following steps: 1) load app for first time so that the
   * initial New York City data is shown 2) press the refresh button on the
   * app 3) go offline 4) reload the app. You expect to see the newer NYC
   * data, but you actually see the initial data. This happens because the
   * service worker is not yet activated. The code below essentially lets
   * you activate the service worker faster.
   */
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  console.log('[Service Worker] Fetch', e.request.url);
  var dataUrl = 'https://query.yahooapis.com/v1/public/yql';
  if (e.request.url.indexOf(dataUrl) > -1) {
    /*
     * When the request URL contains dataUrl, the app is asking for fresh
     * weather data. In this case, the service worker always goes to the
     * network and then caches the response. This is called the "Cache then
     * network" strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-then-network
     */
    e.respondWith(
      caches.open(dataCacheName).then(function(cache) {
        return fetch(e.request).then(function(response){
          cache.put(e.request.url, response.clone());
          return response;
        });
      })
    );
  } else {
    /*
     * The app is asking for app shell files. In this scenario the app uses the
     * "Cache, falling back to the network" offline strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
     */
    e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      })
    );
  }
});
  
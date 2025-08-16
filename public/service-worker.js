/* eslint-disable no-restricted-globals */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.

// Cache names
const CACHE_NAME = 'hedge-fund-app-cache-v1';
const DATA_CACHE_NAME = 'hedge-fund-app-data-cache-v1';

// URLs to cache during installation
const STATIC_URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(STATIC_URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, DATA_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper function to determine if a request is for an API call
const isApiRequest = (url) => {
  const parsedUrl = new URL(url);
  return parsedUrl.pathname.startsWith('/api/');
};

// Helper function to determine if a request is for a static asset
const isStaticAsset = (url) => {
  const parsedUrl = new URL(url);
  return (
    parsedUrl.pathname.startsWith('/static/') ||
    parsedUrl.pathname.endsWith('.js') ||
    parsedUrl.pathname.endsWith('.css') ||
    parsedUrl.pathname.endsWith('.png') ||
    parsedUrl.pathname.endsWith('.jpg') ||
    parsedUrl.pathname.endsWith('.jpeg') ||
    parsedUrl.pathname.endsWith('.svg') ||
    parsedUrl.pathname.endsWith('.ico') ||
    parsedUrl.pathname.endsWith('.json')
  );
};

// Fetch event - handle requests with different strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // API requests - Network first, then cache
  if (isApiRequest(request.url)) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((response) => {
            // If response is valid, clone and store in cache
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // If network fails, try to get from cache
            return cache.match(request);
          });
      })
    );
    return;
  }

  // Static assets - Cache first, then network
  if (isStaticAsset(request.url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          // If response is valid, clone and store in cache
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML navigation requests - Network first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If response is valid, clone and store in cache
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Default strategy - Stale while revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached response immediately if available
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          // Update cache with fresh response
          if (networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If both cache and network fail, return a simple offline page
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Network error occurred', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
          });
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-backtest-data') {
    event.waitUntil(syncBacktestData());
  } else if (event.tag === 'sync-ml-models') {
    event.waitUntil(syncMLModels());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/badge.png',
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Helper function to sync backtest data when online
async function syncBacktestData() {
  const db = await openDB();
  const pendingBacktests = await db.getAll('pendingBacktests');
  
  for (const backtest of pendingBacktests) {
    try {
      const response = await fetch('/api/backtests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backtest)
      });
      
      if (response.ok) {
        await db.delete('pendingBacktests', backtest.id);
      }
    } catch (error) {
      console.error('Failed to sync backtest:', error);
    }
  }
}

// Helper function to sync ML models when online
async function syncMLModels() {
  const db = await openDB();
  const pendingModels = await db.getAll('pendingMLModels');
  
  for (const model of pendingModels) {
    try {
      const response = await fetch('/api/ml/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(model)
      });
      
      if (response.ok) {
        await db.delete('pendingMLModels', model.id);
      }
    } catch (error) {
      console.error('Failed to sync ML model:', error);
    }
  }
}

// Helper function to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('hedgeFundAppDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingBacktests')) {
        db.createObjectStore('pendingBacktests', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('pendingMLModels')) {
        db.createObjectStore('pendingMLModels', { keyPath: 'id' });
      }
    };
  });
}
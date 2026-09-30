const CACHE_NAME = 'student-attendance-v3';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',
  'https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.0/firebase-database-compat.js'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('تم فتح الـ Cache');
      return cache.addAll(urlsToCache).catch(err => {
        console.log('بعض الملفات لم تُحمّل في Cache:', err);
        // لا نرفع الخطأ - فقط حمّل ما استطعت
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('حذف Cache القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// الرد على الطلبات
self.addEventListener('fetch', event => {
  // تجاهل طلبات Firebase
  if (event.request.url.includes('firebaseio.com') ||
      event.request.url.includes('firebaseapp.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // أولاً: جرب Cache
      if (response) {
        return response;
      }

      // ثانياً: جرب الشبكة
      return fetch(event.request).then(response => {
        // تحقق من أن الـ response صحيح
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // انسخ الـ Response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // إذا فشل الشبكة والـ Cache، أرجع صفحة offline (اختياري)
        // يمكنك إرجاع صفحة offline.html هنا
        return new Response('لا يوجد اتصال بالإنترنت');
      });
    })
  );
});

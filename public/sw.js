
var CACHE_STATIC_NAME = 'static-v2';
var CACHE_DYNAMIC_NAME = 'dynamic-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/css/app.css',
  '/src/css/main.css',
  '/src/js/main.js',
  '/src/js/material.min.js',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
]

self.addEventListener('install', function(event) {
  console.log("[Service Worker] Installing...");
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then(function(cache) {
        cache.addAll(STATIC_ASSETS);
      })
  )
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(keyList) {
        return Promise.all(keyList.map(function(key) {
          if (key !== CACHE_STATIC_NAME) {
            return caches.delete(key);
          }
        }));
      })
  );
});

// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//       .then(function(response) {
//         if (response) {
//           return response;
//         } else {
//           return fetch(event.request)
//             .then(function(res) {
//               return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(function(cache) {
//                   cache.put(event.request.url, res.clone());
//                   return res;
//                 });
//             })
//             .catch(function(err) {

//             });
//         }
//       })
//   );
// });

// NETWORK ONLY
// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     fetch(event.request) 
//   );
// });

// CACHE ONLY 
// self.addEventListener('fetch', (event) => {
//   event.respondWith(
//     caches.match(event.request)
//   );
// });

// NETWORK, CACHE FALLBACK
// self.addEventListener('fetch', (event) =>{
//   event.respondWith(
//     fetch(event.request)
//     .then( res => {
//       caches.open('dynamic')
//         .then(cache => {
//           cache.put(event.response.url, res.clone());
//           return res;
//         })
//     })
//       .catch((err) => {
//         return caches.match(event.request)
//       })
//   );
// });

// CACHE, NETWORK FALLBACK 
// self.addEventListener('fetch', (event) => {
//   event.respondWith(
//     caches.match(event.request)
//       .then(res => {
//         if (res) {
//           return res;
//         } else {
//           return fetch(event.request);
//         }
//       })
//   );
// });

// DYNAMIC CACHING FOR CACHE, THEN NETWORK 
// self.addEventListener('fetch', (event) => {
//   event.respondWith(
//     caches.open(CACHE_DYNAMIC_NAME)
//       .then(cache => {
//         return fetch(event.request)
//           .then(res => {
//             cache.put(event.request.url, res.clone());
//             return res;
//           })
//       })
//   );
// });

self.addEventListener('fetch', event => {
  const url = 'https://httpbin.org/get';

  if(event.request.url.indexOf(url) > -1) { // request is a get request, needs to be dynamicly cached
    // here we would want to get response from network and update dynamic cache
    event.respondWith(
      caches.open(CACHE_DYNAMIC_NAME)
        .then(cache => {
          return fetch(event.request)
            .then(res => {
              cache.put(event.request.url, res.clone());
              return res;
            })
        })
    );
  } else if (new RegExp('\\b' + STATIC_ASSETS.join('\\b|\\b') + '\\b').test(event.request.url)) {
      // request already exists in cache, implement cache only stragey
      // this would make sense if there are things that you only want loaded from cache
      // e.g. images
      event.respondWith( 
        caches.match(event.request)
      );
  } else {
    // here we want to try finding what we need in the satic cache, 
    // if it isnt there, get it from the network and add it dynamicly/
    // if that dosnt work either, show the 'sorry this isnt working' page
    event.respondWith(
      caches.match(event.response) // return entry from cache or null if not found
        .then(response => {
          if(response) {
            return response;
          } else {
            return fetch(event.request) // this is the network request
              .then(res => { // we now want to add this response to the cache dynamicly
                return caches.open(CACHE_DYNAMIC_NAME) // opens a new cache with title dynamic
                  .then(cache => {
                    cache.put(event.request.url, res.clone()); // put allows us to store key value pairs in the cache
                    // note that responses (res) can only be used/ consumed once. if we dont add clone(), it will be used up, and we end up returning nothing
                    // by using clone(), we clonse the org respone and then store that in the dynamic cache
                    return res; // here we need to return what the network requests gets after saving it. if not, nothing would return
                  })
              })
              .catch(err => {
                return caches.open(CACHE_STATIC_NAME)
                  .then(cache => {
                    return cache.match('/offline.html');
                  })
              })
          }
        })
    );
  }
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_DYNAMIC_NAME)
      .then(cache => {
        return fetch(event.request)
          .then(res => {
            cache.put(event.request.url, res.clone());
            return res;
          })
      })
  );
});
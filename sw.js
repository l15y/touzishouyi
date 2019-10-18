const SW_VERSION = '1';

self.addEventListener('install', function(event) {
    event.waitUntil(self.skipWaiting());
});

// 监听 service workers 更新时间
self.addEventListener('activate', function(event) {
    // console.log('sw.js 更新');
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // 清理旧版本
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // console.log(cacheName, SW_VERSION);
                        if (cacheName !== SW_VERSION) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

// 缓存请求
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(res => {
            if (res) {
                setTimeout(() => {
                    console.log(res.url);

                }, 0)
                return res;
            }
            // 请求是一个流，只能使用一次，为了再次使用这里需要克隆
            const requestToCache = event.request.clone();
            // 针对缓存中没有存在资源这里重新请求一下
            return fetch(requestToCache).then(res => {
                // 请求返回的结果错误 则不缓存
                if (!res || res.status !== 200) {
                    return res;
                }
                // 克隆响应
                const responseToCache = res.clone();

                // 打开缓存，将响应添加进去
                caches
                    .open(SW_VERSION)
                    .then(cache => cache.put(requestToCache, responseToCache));

                return res;
            });
        })
    );
});
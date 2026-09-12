/* =======================================================================
   Escalas de uso frecuente en Geriatría — service worker
   Estrategia: se precarga el paquete local de la aplicación web progresiva
   y se sirve desde caché. Las fuentes de
   Google se guardan la primera vez que se usan, para que la aplicación
   conserve su tipografía sin conexión.
   Al cambiar de versión se cambia CACHE y se borran las cachés viejas.
   ======================================================================= */

const CACHE = 'escalas-geriatria-v2.10.1';

const PRECARGA = [
  './',
  './index.html',
  './ui-v3.css',
  './manifest.json',
  './icon-120.png',
  './icon-152.png',
  './icon-167.png',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

/* Instalación: precargar el núcleo. Se usa addAll tolerante para que un
   solo archivo ausente no invalide toda la instalación. */
self.addEventListener('install', e=>{
  e.waitUntil((async ()=>{
    const c = await caches.open(CACHE);
    await Promise.all(PRECARGA.map(u=>c.add(u).catch(()=>null)));
    self.skipWaiting();
  })());
});

/* Activación: eliminar cachés de versiones anteriores. */
self.addEventListener('activate', e=>{
  e.waitUntil((async ()=>{
    const claves = await caches.keys();
    await Promise.all(claves.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e=>{
  if(e.data==='skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);
  const propio = url.origin === self.location.origin;
  const fuentes = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if(!propio && !fuentes) return;

  /* Navegación: red primero para recibir actualizaciones, con la copia en
     caché como respaldo cuando no hay conexión. */
  if(req.mode === 'navigate'){
    e.respondWith((async ()=>{
      try{
        const red = await fetch(req);
        const c = await caches.open(CACHE);
        c.put('./index.html', red.clone());
        return red;
      }catch(err){
        const c = await caches.open(CACHE);
        return (await c.match('./index.html')) || (await c.match('./')) || Response.error();
      }
    })());
    return;
  }

  /* Recursos: caché primero, y si no está se pide y se guarda. */
  e.respondWith((async ()=>{
    const c = await caches.open(CACHE);
    const hit = await c.match(req);
    if(hit) return hit;
    try{
      const red = await fetch(req);
      if(red && (red.ok || red.type === 'opaque')) c.put(req, red.clone());
      return red;
    }catch(err){
      return Response.error();
    }
  })());
});

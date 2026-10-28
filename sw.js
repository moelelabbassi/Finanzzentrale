/* MOEL Finance – Offline-Unterstützung.
   App-Dateien: erst Netz (damit Updates sofort ankommen), sonst Cache.
   Diagramm-Bibliothek & Schriften: aus dem Cache, im Hintergrund aktualisiert.
   Deine Finanzdaten liegen NICHT hier, sondern im Speicher der App auf dem Gerät. */
const CACHE='moel-finance-v3';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    e.respondWith(fetch(req).then(res=>{
      if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}
      return res;
    }).catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('./index.html'))));
    return;
  }
  if(/cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url.hostname)){
    e.respondWith(caches.open(CACHE).then(c=>c.match(req).then(hit=>{
      const net=fetch(req).then(res=>{if(res.ok||res.type==='opaque')c.put(req,res.clone());return res;}).catch(()=>hit);
      return hit||net;
    })));
  }
});

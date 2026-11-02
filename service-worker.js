const CACHE_NAME="mmd-shell-v15";
const CORE=["./","./index.html","./install.html","./app.js","./style.css","./assets/icon.svg","./assets/icon-192.svg","./manifest.webmanifest","./version.json"];
self.addEventListener("message",event=>{if(event.data?.type==="SKIP_WAITING")self.skipWaiting()});
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener("push",event=>{
 let payload={};try{payload=event.data?event.data.json():{}}catch(_){payload={body:event.data?.text()||"پیام جدید"}}
 const title=payload.title||"پیام جدید در MMD";
 event.waitUntil(self.registration.showNotification(title,{body:payload.body||"یک پیام جدید دریافت کردی.",icon:"./assets/icon.svg",badge:"./assets/icon-192.svg",tag:payload.tag||"mmd-message",renotify:true,data:{url:payload.url||"./"}}));
});
self.addEventListener("notificationclick",event=>{
 event.notification.close();const target=new URL(event.notification.data?.url||"./",self.registration.scope).href;
 event.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{for(const client of list){if("focus"in client)return client.focus().then(()=>client.navigate(target))}return self.clients.openWindow(target)}));
});

self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
 event.respondWith(fetch(request).then(response=>{
  if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}
  return response;
 }).catch(()=>caches.match(request).then(cached=>cached||caches.match("./index.html"))));
});
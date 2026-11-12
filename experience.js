/* UPLAND EXPERIENCE — client-side enhancements; no schema changes */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const safe=(s)=>String(s||"").toLocaleLowerCase("fa");
function getAccountId(){
 try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k||!k.startsWith("sb-")||!k.endsWith("-auth-token"))continue;const raw=JSON.parse(localStorage.getItem(k)||"{}");const id=raw?.user?.id||raw?.currentSession?.user?.id;if(id)return id}}catch(_){}
 return "local";
}
const savedKey=()=>"upland_saved_posts_"+getAccountId();
function getSavedPosts(){try{return new Set(JSON.parse(localStorage.getItem(savedKey())||"[]").map(String))}catch(_){return new Set()}}
function setSavedPosts(set){try{localStorage.setItem(savedKey(),JSON.stringify([...set]))}catch(_){toast("فضای ذخیره‌سازی دستگاه در دسترس نیست.")}}
function addFeedTools(){
 const feed=$("humor-feed"),head=document.querySelector("#page-humor .section-head");
 if(!feed||!head||$("ux-feed-tools"))return;
 const tools=document.createElement("div");tools.id="ux-feed-tools";tools.className="ux-feed-tools";
 tools.innerHTML='<input id="ux-feed-search" type="search" placeholder="جست‌وجو در نوشته‌ها و نام‌ها…" aria-label="جست‌وجو در همتانه"><button class="ux-tool-chip active" data-feed-filter="all">همه</button><button class="ux-tool-chip" data-feed-filter="media">رسانه‌دار</button><button class="ux-tool-chip" data-feed-filter="text">نوشته‌ها</button><button class="ux-tool-chip" data-feed-filter="saved">ذخیره‌شده‌ها</button><span class="ux-count" id="ux-feed-count"></span>';
 head.insertAdjacentElement("afterend",tools);
 const update=()=>{const q=safe($("ux-feed-search").value),saved=getSavedPosts();let n=0;feed.querySelectorAll(".community-post").forEach(card=>{const media=!!card.querySelector(":scope > img,:scope > video");const filter=tools.dataset.filter||"all";const isSaved=saved.has(String(card.dataset.postId||""));const match=(!q||safe(card.innerText).includes(q))&&(filter==="all"||(filter==="media"&&media)||(filter==="text"&&!media)||(filter==="saved"&&isSaved));card.classList.toggle("hidden",!match);if(match)n++});$("ux-feed-count").textContent=n.toLocaleString("fa")+" مطلب"};
 tools.dataset.filter="all";$("ux-feed-search").addEventListener("input",update);
 tools.addEventListener("click",e=>{const b=e.target.closest("[data-feed-filter]");if(!b)return;tools.dataset.filter=b.dataset.feedFilter;tools.querySelectorAll("[data-feed-filter]").forEach(x=>x.classList.toggle("active",x===b));update()});
 const observer=new MutationObserver(()=>{update();enhancePosts()});observer.observe(feed,{childList:true,subtree:true});update();enhancePosts();
}
function enhancePosts(){const feed=$("humor-feed");if(!feed)return;feed.querySelectorAll(".community-post").forEach(card=>{if(card.querySelector(".ux-share-post"))return;const bar=card.querySelector(".post-reactions");if(!bar)return;const saved=getSavedPosts(),postId=String(card.dataset.postId||"");const save=document.createElement("button");save.type="button";save.className="ux-tool-chip ux-save-post";save.textContent=saved.has(postId)?"★ ذخیره‌شده":"☆ ذخیره";save.setAttribute("aria-pressed",String(saved.has(postId)));save.addEventListener("click",()=>{const next=getSavedPosts();if(next.has(postId))next.delete(postId);else next.add(postId);setSavedPosts(next);save.textContent=next.has(postId)?"★ ذخیره‌شده":"☆ ذخیره";save.setAttribute("aria-pressed",String(next.has(postId)));const filter=$("ux-feed-tools")?.dataset.filter;if(filter==="saved"&&!next.has(postId))card.classList.add("hidden");const count=$("ux-feed-count");if(count&&filter==="saved")count.textContent=$("humor-feed").querySelectorAll(".community-post:not(.hidden)").length.toLocaleString("fa")+" مطلب"});bar.append(save);const b=document.createElement("button");b.type="button";b.className="ux-tool-chip ux-share-post";b.textContent="اشتراک‌گذاری";b.addEventListener("click",async()=>{const text=[card.querySelector("h3")?.textContent,card.querySelector(".post-body")?.textContent].filter(Boolean).join("\n");try{if(navigator.share)await navigator.share({title:"همتانه | UPLAND",text});else{await navigator.clipboard.writeText(text);b.textContent="متن کپی شد";setTimeout(()=>b.textContent="اشتراک‌گذاری",1400)}}catch(_){}});bar.append(b);const comments=card.querySelector(".post-comments-list");if(comments&&!comments.dataset.toggleReady){comments.dataset.toggleReady="1";const toggle=document.createElement("button");toggle.type="button";toggle.className="ux-comments-toggle";toggle.textContent="پنهان‌کردن دیدگاه‌ها";comments.insertAdjacentElement("beforebegin",toggle);toggle.addEventListener("click",()=>{const hidden=comments.classList.toggle("ux-comments-collapsed");toggle.textContent=hidden?"نمایش دیدگاه‌ها":"پنهان‌کردن دیدگاه‌ها"})}});}
function enhanceComposer(){
 const form=$("humor-submit-form");if(!form||form.dataset.uxReady)return;form.dataset.uxReady="1";
 const body=$("humor-body");if(body){const meter=document.createElement("div");meter.className="ux-composer-meter";meter.textContent="۰ / ۵۰۰۰";body.insertAdjacentElement("afterend",meter);body.addEventListener("input",()=>meter.textContent=body.value.length.toLocaleString("fa")+" / ۵۰۰۰ نویسه")}
 const file=$("humor-file");if(file){const preview=document.createElement("div");preview.className="ux-file-preview";preview.style.cssText="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px";file.insertAdjacentElement("afterend",preview);file.addEventListener("change",()=>{preview.innerHTML="";const f=file.files?.[0];if(!f)return;const name=document.createElement("span");name.textContent=f.name+" · "+(f.size/1048576).toFixed(1)+" MB";preview.append(name);if(f.type.startsWith("image/")){const img=document.createElement("img");img.src=URL.createObjectURL(f);img.style.cssText="width:110px;height:110px;object-fit:cover;border-radius:14px";preview.append(img)}})}
}
function enhanceChat(){
 const messages=$("chat-messages"),compose=$("chat-compose")||document.querySelector(".chat-compose");
 if(!messages||!compose||$("ux-chat-tools"))return;
 const tools=document.createElement("div");tools.id="ux-chat-tools";tools.className="ux-chat-tools";
 tools.innerHTML='<input id="ux-chat-search" type="search" placeholder="جست‌وجو در پیام‌های همین گفت‌وگو…"><span class="ux-count">جست‌وجوی پیام‌ها</span><button type="button" id="ux-chat-record" title="ضبط پیام صوتی">● ضبط صدا</button><span id="ux-chat-record-state" aria-live="polite"></span>';
 messages.insertAdjacentElement("beforebegin",tools);
 $("ux-chat-search").addEventListener("input",()=>{const q=safe($("ux-chat-search").value);messages.querySelectorAll(".chat-bubble").forEach(b=>b.classList.toggle("hidden",!!q&&!safe(b.innerText).includes(q)))});
 if(!$("ux-chat-emoji-row")){
 const row=document.createElement("div");row.id="ux-chat-emoji-row";row.className="ux-emoji-row";
 ["🙂","😂","❤️","👍","🙏","🔥","🎉","💯","✨","📚","🤝","😅"].forEach(emoji=>{const b=document.createElement("button");b.type="button";b.textContent=emoji;b.setAttribute("aria-label","افزودن "+emoji);b.addEventListener("click",()=>{const input=$("chat-input");if(!input)return;const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;input.value=input.value.slice(0,start)+emoji+input.value.slice(end);input.focus();input.setSelectionRange(start+emoji.length,start+emoji.length);input.dispatchEvent(new Event("input",{bubbles:true}))});row.append(b)});
 compose.insertAdjacentElement("beforebegin",row);
  }
 $("chat-input")?.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();$("chat-form")?.requestSubmit()}}); 
  const chatInput=$("chat-input");
  if(chatInput&&!chatInput.dataset.uxEnterReady){chatInput.dataset.uxEnterReady="1";chatInput.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing&&!e.repeat){e.preventDefault();$("chat-form")?.requestSubmit()}})}
  if(recorder?.state==="recording"){recorder.stop();return}
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){if(recordState)recordState.textContent="ضبط صدا در این مرورگر پشتیبانی نمی‌شود.";return}
  try{
   stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];recorder=new MediaRecorder(stream);recordStarted=Date.now();
   recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
   recorder.onstop=()=>{if(recordLimit)clearTimeout(recordLimit);recordLimit=null;const elapsed=Math.round((Date.now()-recordStarted)/1000);const blob=new Blob(chunks,{type:recorder.mimeType||"audio/webm"});stream?.getTracks().forEach(t=>t.stop());stream=null;if(blob.size){const file=new File([blob],"upland-voice-"+Date.now()+".webm",{type:blob.type});const transfer=new DataTransfer();transfer.items.add(file);$("chat-file").files=transfer.files;$("chat-file").dispatchEvent(new Event("change",{bubbles:true}));$("chat-input").value=$("chat-input").value.trim();if(recordState)recordState.textContent="پیام صوتی "+Math.floor(elapsed/60)+":"+String(elapsed%60).padStart(2,"0")+" آمادهٔ ارسال است."}record.textContent="● ضبط صدا";record.classList.remove("recording")};
   recorder.start();recordLimit=setTimeout(()=>{if(recorder?.state==="recording"){if(recordState)recordState.textContent="حداکثر زمان ضبط (۳ دقیقه) تمام شد.";recorder.stop()}},180000);record.textContent="■ پایان ضبط";record.classList.add("recording");if(recordState)recordState.textContent="در حال ضبط…";
  }catch(e){stream?.getTracks().forEach(t=>t.stop());stream=null;if(recordState)recordState.textContent="دسترسی به میکروفون داده نشد."}
 });
 document.addEventListener("visibilitychange",()=>{if(document.hidden&&recorder?.state==="recording"){recorder.stop();if(recordState)recordState.textContent="ضبط با خروج از صفحه متوقف شد."}});

 const obs=new MutationObserver(()=>{messages.querySelectorAll(".chat-bubble").forEach(b=>{if(b.querySelector(".ux-copy-message"))return;const p=b.querySelector("p");if(!p||!p.textContent.trim())return;const c=document.createElement("button");c.type="button";c.className="ux-copy-message";c.textContent="کپی";c.style.cssText="font-size:11px;background:transparent;border:0;color:#83dcd8;margin-inline-start:8px";c.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(p.textContent);c.textContent="کپی شد";setTimeout(()=>c.textContent="کپی",1200)}catch(_){c.textContent="ناموفق"}});b.querySelector("small")?.append(c)})});
 obs.observe(messages,{childList:true,subtree:true});obs.takeRecords();
}
const pages=[["today","امروز","نمای کلی روز"],["today-work","کارهای امروز","فهرست کارهای روزانه"],["humor","همتانه","شبکه اجتماعی مدرسه"],["chat","چت","پیام‌رسان خصوصی"],["smart","برنامه‌ریز هوشمند","برنامه هفتگی"],["tasks","وظایف و تکالیف","مدیریت کارها"],["programs","همه برنامه‌ها","مرکز برنامه‌ها"],["routines","برنامه ثابت","روتین هفتگی"],["reports","گزارش پیشرفت","آمار عملکرد"],["profile","پروفایل من","حساب شخصی"],["settings","تنظیمات","شخصی‌سازی"]];
function commandPalette(){
 if($("ux-command-overlay"))return;
 const overlay=document.createElement("div");overlay.id="ux-command-overlay";overlay.className="ux-command-overlay";overlay.hidden=true;
 overlay.innerHTML='<div class="ux-command-box" role="dialog" aria-modal="true" aria-label="جست‌وجوی سریع"><input id="ux-command-search" type="search" placeholder="کجا می‌خواهی بروی؟ (مثلاً چت، برنامه‌ریز…)"><div id="ux-command-list" class="ux-command-list"></div><small style="color:#8ca8c0">کلید میان‌بر: Ctrl + K · بستن: Esc</small></div>';
 document.body.append(overlay);
 const draw=()=>{const q=safe($("ux-command-search").value);$("ux-command-list").innerHTML="";pages.filter(p=>safe(p[1]+" "+p[2]).includes(q)).forEach(p=>{const b=document.createElement("button");b.innerHTML="<b>"+p[1]+"</b><small>"+p[2]+"</small>";b.addEventListener("click",()=>{if(typeof window.navigate==="function")window.navigate(p[0]);else document.querySelector('[data-page="'+p[0]+'"]')?.click();overlay.hidden=true});$("ux-command-list").append(b)})};
 $("ux-command-search").addEventListener("input",draw);overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.hidden=true});document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();overlay.hidden=false;$("ux-command-search").value="";draw();$("ux-command-search").focus()}if(e.key==="Escape")overlay.hidden=true});draw();
}
function lightbox(){
 document.addEventListener("click",e=>{const img=e.target.closest("#humor-feed .community-post > img");if(!img)return;const box=document.createElement("div");box.className="ux-lightbox";const large=document.createElement("img");large.src=img.src;large.alt=img.alt||"نمایش تصویر";box.append(large);box.addEventListener("click",()=>box.remove());document.body.append(box)});
}
function addActiveMembers(){const feed=$("humor-feed"),head=document.querySelector("#page-humor .section-head");if(!feed||!head||$("ux-active-members"))return;const strip=document.createElement("section");strip.id="ux-active-members";strip.className="ux-active-members";strip.innerHTML='<div><b>اعضای فعال</b><small>از میان نویسندگان مطالب اخیر</small></div><div class="ux-active-list"></div>';head.insertAdjacentElement("afterend",strip);const draw=()=>{const seen=new Set(),items=[];feed.querySelectorAll(".community-post .post-author-link").forEach(a=>{const name=a.innerText.trim();if(!name||seen.has(name))return;seen.add(name);items.push(a)});const list=strip.querySelector(".ux-active-list");list.innerHTML="";items.slice(0,12).forEach(a=>{const b=document.createElement("button");b.type="button";b.className="ux-active-person";const av=a.querySelector("img");if(av){const im=av.cloneNode();b.append(im)}else{const sp=document.createElement("span");sp.textContent="✦";b.append(sp)}const nm=document.createElement("small");nm.textContent=a.innerText.trim();b.append(nm);b.addEventListener("click",()=>a.click());list.append(b)})};new MutationObserver(draw).observe(feed,{childList:true,subtree:true});draw()}
function start(){addFeedTools();enhanceComposer();enhanceChat();commandPalette();lightbox();enhancePosts();addActiveMembers();const feed=$("humor-feed");if(feed)new MutationObserver(()=>{addFeedTools();enhanceComposer();enhancePosts();addActiveMembers()}).observe(feed,{childList:true,subtree:true});const chat=$("chat-content");if(chat)new MutationObserver(()=>enhanceChat()).observe(chat,{childList:true,subtree:true});}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();

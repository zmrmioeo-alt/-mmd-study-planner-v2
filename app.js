/* MMD Study Planner - client application */
const SUPABASE_URL = "https://tbmxbtbayqgfvdlmeuaz.supabase.co";
const SUPABASE_KEY = "sb_publishable_n89FjocOtomNmAReFaP-vg_PMFbVow3";
const ADMIN_FUNCTION = SUPABASE_URL + "/functions/v1/admin-manage";
const MANAGEMENT_ADMIN_IDS = new Set(["d32c5ceb-ca91-46c8-978c-fb3d33c45eca","9abd24a9-9fc4-48f9-8046-c45b27a52ec0"]);
const isManagementAdmin = () => !!currentUser && MANAGEMENT_ADMIN_IDS.has(currentUser.id);
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = (id) => document.getElementById(id);
function makeUUID(){if(window.crypto?.randomUUID)return window.crypto.randomUUID();const bytes=new Uint8Array(16);if(window.crypto?.getRandomValues)window.crypto.getRandomValues(bytes);else for(let i=0;i<16;i++)bytes[i]=Math.floor(Math.random()*256);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=[...bytes].map(x=>x.toString(16).padStart(2,"0"));return h.slice(0,4).join("")+"-"+h.slice(4,6).join("")+"-"+h.slice(6,8).join("")+"-"+h.slice(8,10).join("")+"-"+h.slice(10).join("");}
if(window.jalaliDatepicker){window.jalaliDatepicker.startWatch({persianDigits:true,targetValueInput:"attr",targetValueType:"attr",zIndex:9999});}
const fa = (n) => new Intl.NumberFormat("fa-IR").format(n);
const weekdays = ["یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه","شنبه"];
let currentUser = null, profile = null, tasks = [], routines = [], settings = {}, taskFilter = "all";
let weeklyAvailability = {}, weeklyPlan = [];
let featureFlags={chat_enabled:true,humor_enabled:true};
const smartKey=()=> "mmd_smart_planner_"+(currentUser?.id||"guest");
function smartEnabled(){return !!currentUser;}
function syncSmartPlanner(){if($("smart-planner-toggle")){$("smart-planner-toggle").checked=true;$("smart-planner-toggle").disabled=true;}show("smart-planner-nav",!!currentUser);}
const show = (id, yes=true) => $(id).classList.toggle("hidden", !yes);
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>el.classList.remove("show"),3000)}
function message(id,text,isError=false){$(id).textContent=text;$(id).style.color=isError?"var(--danger)":"var(--accent)"}
function normalizePhone(value){return value.trim().replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[^\d+]/g,"")}
function todayStart(){const d=new Date();d.setHours(0,0,0,0);return d}
function isToday(value){if(!value)return false;const d=new Date(value),n=new Date();return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate()}
function dateLabel(){return new Intl.DateTimeFormat("fa-IR-u-ca-persian",{weekday:"long",year:"numeric",month:"long",day:"numeric"}).format(new Date())}
function jalaliParts(value){const d=value instanceof Date?value:new Date(value);return new Intl.DateTimeFormat("en-US-u-ca-persian",{year:"numeric",month:"numeric",day:"numeric"}).formatToParts(d).reduce((o,p)=>(o[p.type]=Number(p.value),o),{});}
function jalaliDate(value,withTime=false){if(!value)return "—";const d=new Date(value);if(Number.isNaN(d.getTime()))return "—";return new Intl.DateTimeFormat("fa-IR-u-ca-persian",{year:"numeric",month:"2-digit",day:"2-digit",...(withTime?{hour:"2-digit",minute:"2-digit"}:{})}).format(d);}
function jalaliInputToDate(value,end=false){const s=String(value||"").trim().replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[-.]/g,"/");const m=s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);if(!m)throw new Error("تاریخ را به شکل ۱۴۰۵/۰۸/۱۱ وارد کنید.");const jy=+m[1],jm=+m[2],jd=+m[3];if(jm<1||jm>12||jd<1||jd>(jm<=6?31:jm<=11?30:30))throw new Error("تاریخ شمسی معتبر نیست.");const start=new Date(jy+621,2,19,12);let found=null;for(let i=0;i<6;i++){const x=new Date(start);x.setDate(start.getDate()+i);const p=jalaliParts(x);if(p.year===jy&&p.month===1&&p.day===1){found=x;break;}}if(!found)throw new Error("تبدیل تاریخ شمسی انجام نشد.");const offset=(jm<=6?(jm-1)*31:186+(jm-7)*30)+(jd-1);found.setDate(found.getDate()+offset);const check=jalaliParts(found);if(check.year!==jy||check.month!==jm||check.day!==jd)throw new Error("این تاریخ در تقویم شمسی وجود ندارد.");found.setHours(end?23:0,end?59:0,end?59:0,0);return found;}


async function compressImageForUpload(file,{maxBytes=1572864,maxSide=1920}={}){
 if(!file.type.startsWith("image/"))return file;
 let bitmap;
 try{bitmap=await createImageBitmap(file)}catch(_){return file}
 let width=bitmap.width,height=bitmap.height,scale=Math.min(1,maxSide/Math.max(width,height));
 width=Math.max(1,Math.round(width*scale));height=Math.max(1,Math.round(height*scale));
 const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
 canvas.width=width;canvas.height=height;ctx.drawImage(bitmap,0,0,width,height);bitmap.close?.();
 let quality=.84,blob=null;
 for(let i=0;i<8;i++){blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",quality));if(!blob||blob.size<=maxBytes)break;quality=Math.max(.35,quality-.07)}
 if(!blob)return file;
 return new File([blob],file.name.replace(/\.[^.]+$/,"")+".jpg",{type:"image/jpeg",lastModified:Date.now()});
}
async function compressVideoForUpload(file,{maxBytes=15728640,maxSide=1280}={}){if(!file.type.startsWith("video/")||file.size<=maxBytes)return file;if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)return file;const video=document.createElement("video"),url=URL.createObjectURL(file);let stream=null,audioStream=null,raf=0;try{await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error("آماده‌سازی ویدئو بیش از حد طول کشید.")),15000);video.onloadedmetadata=()=>{clearTimeout(timer);resolve()};video.onerror=()=>{clearTimeout(timer);reject(new Error("خواندن ویدئو ممکن نشد."))};video.muted=true;video.playsInline=true;video.preload="auto";video.src=url});const ratio=Math.min(1,maxSide/Math.max(video.videoWidth,video.videoHeight)),canvas=document.createElement("canvas");canvas.width=Math.max(2,Math.round(video.videoWidth*ratio/2)*2);canvas.height=Math.max(2,Math.round(video.videoHeight*ratio/2)*2);const ctx=canvas.getContext("2d");stream=canvas.captureStream(20);try{audioStream=video.captureStream?.()||video.mozCaptureStream?.();audioStream?.getAudioTracks?.().forEach(t=>stream.addTrack(t))}catch(_){}const mime=["video/mp4","video/webm;codecs=vp8","video/webm"].find(t=>MediaRecorder.isTypeSupported(t));if(!mime)return file;const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:900000,audioBitsPerSecond:64000}),chunks=[];const stopped=new Promise((resolve,reject)=>{recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};recorder.onerror=()=>reject(new Error("فشرده‌سازی ویدئو ناموفق بود."));recorder.onstop=resolve});const ended=new Promise((resolve,reject)=>{video.onended=resolve;video.onerror=()=>reject(new Error("پخش ویدئو متوقف شد."))});const draw=()=>{if(video.ended||video.paused)return;ctx.drawImage(video,0,0,canvas.width,canvas.height);raf=requestAnimationFrame(draw)};recorder.start(1000);await video.play();draw();await Promise.race([ended,new Promise((_,reject)=>setTimeout(()=>reject(new Error("فشرده‌سازی ویدئو بیش از حد طول کشید.")),Math.max(60000,(video.duration||0)*2500)))]);cancelAnimationFrame(raf);if(recorder.state!=="inactive")recorder.stop();await stopped;const blob=new Blob(chunks,{type:mime});if(!blob.size||blob.size>=file.size)return file;return new File([blob],file.name.replace(/\.[^.]+$/,"")+(mime==="video/mp4"?".mp4":".webm"),{type:mime,lastModified:Date.now()})}catch(err){console.warn("Video compression skipped",err);return file}finally{cancelAnimationFrame(raf);stream?.getTracks().forEach(t=>t.stop());audioStream?.getTracks?.().forEach(t=>t.stop());video.pause();video.removeAttribute("src");video.load();URL.revokeObjectURL(url)}}
async function compressUploadFile(file,options={}){
 if(!file)return file;
 if(file.type.startsWith("image/"))return compressImageForUpload(file,options.image||{});
 if(file.type.startsWith("video/"))return compressVideoForUpload(file,options.video||{});
 return file;
}

function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function callAdmin(action,payload={}){const {data:{session}}=await db.auth.getSession();if(!session)throw new Error("نشست ورود معتبر نیست.");const res=await fetch(ADMIN_FUNCTION,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+session.access_token,"apikey":SUPABASE_KEY},body:JSON.stringify({action,...payload})});const body=await res.json().catch(()=>({}));if(!res.ok)throw new Error(body.error||"خطا در ارتباط با سرویس مدیریت");return body}
let enteringUserId=null;
async function continueAfterPolicy(){
 show("terms-view",false);
 show("auth-view",true);
 show("login-card",true);
 const {data:{session},error}=await db.auth.getSession();if(error)throw error;
 if(session){show("login-card",false);await enterApp(session.user)}
}
$("terms-checkbox").addEventListener("change",e=>{$("accept-terms").disabled=!e.target.checked});
$("accept-terms").addEventListener("click",async()=>{
 if(!$("terms-checkbox").checked)return;
 try{localStorage.setItem("mmd_terms_accepted","mmd-terms-2026-11-v4");await continueAfterPolicy()}
 catch(err){console.error(err);message("terms-message","ذخیره تأیید قوانین ممکن نشد. تنظیمات مرورگر را بررسی کنید.",true)}
});
async function boot(){
 if("serviceWorker" in navigator){navigator.serviceWorker.register("./service-worker.js").catch(err=>console.warn("Service worker unavailable",err));}
 if(localStorage.getItem("mmd_terms_accepted")!=="mmd-terms-2026-11-v4"){show("terms-view",true);show("auth-view",false);show("app-view",false);return}
 db.auth.onAuthStateChange((event)=>{if(event==="SIGNED_OUT"){currentUser=null;profile=null;setupPersonalSwitcher();show("app-view",false);show("expired-subscription-view",false);show("banned-account-view",false);show("auth-view",true)}});
 await continueAfterPolicy();
}
async function syntheticEmail(value){const bytes=new TextEncoder().encode(value.trim().toLowerCase());const digest=await crypto.subtle.digest("SHA-256",bytes);const hex=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("").slice(0,32);return "mmd-"+hex+"@users.mmdplanner.com"}
async function passwordLogin(identifier,password){
 let result;
 if(identifier.includes("@"))result=await db.auth.signInWithPassword({email:identifier,password});
 else{result=await db.auth.signInWithPassword({email:await syntheticEmail(identifier),password});if(result.error){const phone=normalizePhone(identifier);if(/^[0-9+]+$/.test(phone)){result=await db.auth.signInWithPassword({phone,password});if(result.error)result=await db.auth.signInWithPassword({email:phone+"@gmail.com",password})}}}
 if(result.error)throw result.error;
 return result.data.user;
}
$("login-form").addEventListener("submit",async e=>{
 e.preventDefault();message("auth-message","در حال ورود...");
 try{const user=await passwordLogin($("phone").value.trim(),$("password").value);await enterApp(user)}
 catch(err){console.error(err);message("auth-message",err.message||"ورود ناموفق بود.",true)}
});
$("mobile-menu-toggle").addEventListener("click",()=>{const open=$("sidebar").classList.toggle("menu-open");$("mobile-menu-toggle").classList.toggle("is-open",open);$("mobile-menu-toggle").setAttribute("aria-expanded",String(open));$("mobile-menu-toggle").setAttribute("aria-label",open?"بستن فهرست":"باز کردن فهرست")});
document.addEventListener("click",e=>{if(!e.target.closest(".sidebar")){const side=document.querySelector(".sidebar");if(side){side.classList.remove("menu-open");$("mobile-menu-toggle")?.classList.remove("is-open");$("mobile-menu-toggle")?.setAttribute("aria-expanded","false")}}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){document.querySelector(".sidebar")?.classList.remove("menu-open");$("mobile-menu-toggle")?.classList.remove("is-open");$("mobile-menu-toggle")?.setAttribute("aria-expanded","false")}});
$("main-nav").addEventListener("click",e=>{if(e.target.closest("[data-page],#logout-btn")){document.querySelector(".sidebar")?.classList.remove("menu-open");$("mobile-menu-toggle")?.classList.remove("is-open");$("mobile-menu-toggle")?.setAttribute("aria-expanded","false")}});
$("logout-btn").addEventListener("click",async()=>{if(!confirm("مطمئنی می‌خواهی از حساب خارج شوی؟"))return;const {error}=await db.auth.signOut();if(error)toast("خروج انجام نشد: "+error.message);});
// Personal account switcher: available only to the owner's admin account and the owner's second account.
const PERSONAL_ADMIN_ID="d32c5ceb-ca91-46c8-978c-fb3d33c45eca";
const PERSONAL_SECOND_ID="17b4aa61-7b56-4f05-a1b7-871eb5df40db";
const PERSONAL_ADMIN_SLOT="mmd_personal_switch_admin_v1";
const PERSONAL_SECOND_SLOT="mmd_personal_switch_second_v1";
function personalSlotFor(id){return id===PERSONAL_ADMIN_ID?PERSONAL_ADMIN_SLOT:id===PERSONAL_SECOND_ID?PERSONAL_SECOND_SLOT:null}
function readPersonalSession(slot){try{return JSON.parse(localStorage.getItem(slot)||"null")}catch(_){return null}}
async function saveCurrentPersonalSession(){
 const {data:{session}}=await db.auth.getSession();if(!session)return;
 const slot=personalSlotFor(session.user.id);if(slot)localStorage.setItem(slot,JSON.stringify(session));
}
function addPersonalSwitchDialog(){
 if($("personal-switch-dialog"))return $("personal-switch-dialog");
 const wrap=document.createElement("div");wrap.id="personal-switch-dialog";wrap.className="switch-dialog hidden";
 wrap.innerHTML='<form id="personal-switch-form" class="switch-dialog-card"><h3>افزودن حساب دوم</h3><p>شناسه ورود و رمز حساب «سید محمد امین ابطحی» را فقط یک‌بار در همین دستگاه وارد کن. رمز ذخیره نمی‌شود؛ فقط نشست ورود نگهداری می‌شود.</p><label>شناسه ورود<input id="personal-switch-identifier" autocomplete="username" required></label><label>رمز عبور<input id="personal-switch-password" type="password" autocomplete="current-password" required></label><div class="switch-dialog-actions"><button type="button" class="secondary" id="personal-switch-cancel">انصراف</button><button type="submit" class="primary" id="personal-switch-save">ذخیره و تعویض حساب</button></div><p id="personal-switch-message" class="message"></p></form>';
 document.body.append(wrap);
 wrap.addEventListener("click",e=>{if(e.target===wrap)wrap.classList.add("hidden")});
 $("personal-switch-cancel").addEventListener("click",()=>wrap.classList.add("hidden"));
 $("personal-switch-form").addEventListener("submit",async e=>{
  e.preventDefault();const b=$("personal-switch-save");b.disabled=true;$("personal-switch-message").textContent="در حال بررسی حساب...";
  try{
   const {data:{session:primary}}=await db.auth.getSession();if(!primary||primary.user.id!==PERSONAL_ADMIN_ID)throw new Error("ابتدا باید با حساب مدیر اصلی وارد شوی.");
   localStorage.setItem(PERSONAL_ADMIN_SLOT,JSON.stringify(primary));
   const entered=await passwordLogin($("personal-switch-identifier").value.trim(),$("personal-switch-password").value);
   if(entered.id!==PERSONAL_SECOND_ID)throw new Error("این شناسه متعلق به حساب «سید محمد امین ابطحی» نیست.");
   const {data:{session:second}}=await db.auth.getSession();if(!second)throw new Error("نشست حساب دوم ساخته نشد.");
   const {data:secondProfile,error:profileError}=await db.from("profiles").select("id,display_name").eq("id",PERSONAL_SECOND_ID).maybeSingle();
   if(profileError)throw profileError;
   if(!secondProfile||secondProfile.display_name!=="سید محمد امین ابطحی")throw new Error("مشخصات حساب دوم با نام اعلام‌شده مطابقت ندارد.");
   localStorage.setItem(PERSONAL_SECOND_SLOT,JSON.stringify(second));
   $("personal-switch-password").value="";wrap.classList.add("hidden");await enterApp(entered);
  }catch(err){
   const current=readPersonalSession(PERSONAL_ADMIN_SLOT);
   if(current?.access_token&&current?.refresh_token)await db.auth.setSession({access_token:current.access_token,refresh_token:current.refresh_token}).catch(()=>{});
   $("personal-switch-message").textContent=err.message||"افزودن حساب انجام نشد.";
  }finally{b.disabled=false}
 });
 return wrap;
}
async function switchPersonalAccount(targetId){
 const slot=personalSlotFor(targetId);if(!slot)return;
 await saveCurrentPersonalSession();
 const saved=readPersonalSession(slot);
 if(!saved?.access_token||!saved?.refresh_token){
  if(targetId===PERSONAL_SECOND_ID&&currentUser?.id===PERSONAL_ADMIN_ID){addPersonalSwitchDialog().classList.remove("hidden");$("personal-switch-identifier").focus();return}
  toast("نشست این حساب روی دستگاه ذخیره نشده است.");return;
 }
 try{
  const {data,error}=await db.auth.setSession({access_token:saved.access_token,refresh_token:saved.refresh_token});
  if(error)throw error;
  if(!data.user||data.user.id!==targetId)throw new Error("حساب ذخیره‌شده معتبر نیست.");
  await enterApp(data.user);
 }catch(err){toast("تعویض حساب انجام نشد: "+(err.message||"نشست منقضی شده است."))}
}
function setupPersonalSwitcher(){
 const allowed=currentUser?.id===PERSONAL_ADMIN_ID||currentUser?.id===PERSONAL_SECOND_ID;
 const header=$("page-title")?.closest(".topbar");
 let switchButton=$("switch-account-btn");
 if(!allowed){switchButton?.remove();$("pending-switch-account-btn")?.remove();return}
 if(header&&!switchButton){
  switchButton=document.createElement("button");switchButton.id="switch-account-btn";switchButton.type="button";switchButton.className="secondary";switchButton.textContent="تعویض حساب";
  switchButton.addEventListener("click",()=>switchPersonalAccount(currentUser?.id===PERSONAL_ADMIN_ID?PERSONAL_SECOND_ID:PERSONAL_ADMIN_ID));
  header.append(switchButton);
 }
 if(switchButton){switchButton.classList.remove("hidden");switchButton.textContent=currentUser.id===PERSONAL_ADMIN_ID?"تعویض به حساب دوم":"بازگشت به حساب مدیر"}
 const pending=$("pending-logout");
 if(currentUser.id===PERSONAL_SECOND_ID&&pending&&!$("pending-switch-account-btn")){
  const b=document.createElement("button");b.id="pending-switch-account-btn";b.type="button";b.className="secondary";b.textContent="بازگشت به حساب مدیر";
  b.addEventListener("click",()=>switchPersonalAccount(PERSONAL_ADMIN_ID));pending.insertAdjacentElement("beforebegin",b);
 }
 const pendingButton=$("pending-switch-account-btn");
 if(pendingButton)pendingButton.classList.toggle("hidden",currentUser.id!==PERSONAL_SECOND_ID||!readPersonalSession(PERSONAL_ADMIN_SLOT));
}

if($("expired-logout-btn"))$("expired-logout-btn").addEventListener("click",async()=>{if(confirm("مطمئنی می‌خواهی از حساب خارج شوی؟"))await db.auth.signOut()});
if($("banned-logout-btn"))$("banned-logout-btn").addEventListener("click",async()=>{if(confirm("مطمئنی می‌خواهی از حساب خارج شوی؟"))await db.auth.signOut()});
$("show-signup").addEventListener("click",()=>{show("login-card",false);show("signup-card",true)});
$("show-login").addEventListener("click",()=>{show("signup-card",false);show("login-card",true)});
const SIGNUP_CLASSES={"هفتم":["هدف","مسئولیت"],"هشتم":["تلاش","کوشش"],"نهم":["اراده","استقامت"]};
$("signup-account-type").addEventListener("change",()=>{const teacher=$("signup-account-type").value==="teacher";$("signup-school-fields").classList.toggle("hidden",teacher);$("signup-grade").required=!teacher;$("signup-class").required=!teacher});
$("signup-grade").addEventListener("change",()=>{const sel=$("signup-class");sel.innerHTML="";sel.disabled=!$("signup-grade").value;const first=document.createElement("option");first.value="";first.textContent="انتخاب کلاس";sel.append(first);(SIGNUP_CLASSES[$("signup-grade").value]||[]).forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v;sel.append(o)})});
$("signup-form").addEventListener("submit",async e=>{
 e.preventDefault();
 const username=$("signup-username").value.trim().toLowerCase();
 const displayName=$("signup-name").value.trim();
 const password=$("signup-password").value;
 const schoolGrade=$("signup-grade").value,schoolClass=$("signup-class").value;
 const accountType=$("signup-account-type").value==="teacher"?"teacher":"student";
 if(!/^[\p{L}\p{N}_.-]{3,30}$/u.test(username)){message("signup-message","نام کاربری باید ۳ تا ۳۰ نویسه و شامل حروف، عدد، نقطه، خط تیره یا زیرخط باشد.",true);return;}
 if(accountType==="student"&&(!schoolGrade||!schoolClass)){message("signup-message","پایه و نام کلاس اجباری است.",true);return;}
 if(password.length<8){message("signup-message","رمز عبور باید حداقل ۸ نویسه باشد.",true);return;}
 const submit=e.submitter; if(submit)submit.disabled=true;
 message("signup-message","در حال ساخت حساب...");
 try{
  const email=await syntheticEmail(username);
  const {data,error}=await db.auth.signUp({email,password,options:{data:{display_name:displayName,login_id:username,account_type:accountType,school_grade:accountType==="teacher"?"معلم":schoolGrade,school_class:accountType==="teacher"?null:schoolClass}}});
  if(error)throw error;
  if(data.session){show("signup-card",false);await enterApp(data.user);}
  else message("signup-message","حساب ساخته شد؛ برای ورود بدون ایمیل، مدیر باید گزینه «Confirm email» را در تنظیمات Supabase خاموش کند. سپس می‌توانی با نام کاربری و رمز وارد شوی.");
 }catch(err){message("signup-message",err.message||"ثبت‌نام انجام نشد.",true);}
 finally{if(submit)submit.disabled=false;}
});
$("pending-logout").addEventListener("click",()=>db.auth.signOut());
async function checkAppUpdateNotice(){
 try{
  const r=await fetch("./version.json?notice="+Date.now(),{cache:"no-store"});if(!r.ok)return;
  const v=await r.json(),seen=localStorage.getItem("mmd_seen_version");
  if(!v.version||seen===String(v.version))return;
  localStorage.setItem("mmd_seen_version",String(v.version));
  const title="نسخه جدید برنامه منتشر شد · "+v.version,body=v.release_notes||"برای دریافت امکانات تازه، برنامه را به‌روزرسانی کنید.";
  if(localStorage.getItem("mmd_update_notifications")==="on"&&"Notification"in window&&Notification.permission==="granted"){
   const reg=await navigator.serviceWorker?.getRegistration();
   if(reg)await reg.showNotification(title,{body,icon:"./assets/icon.svg",badge:"./assets/icon.svg",tag:"mmd-update",data:{url:"./install.html"}});
   else new Notification(title,{body});
  }
  const wrap=document.createElement("section");wrap.className="form-panel";wrap.style.cssText="margin:0 0 18px;border:1px solid var(--accent);";
  const h=document.createElement("h3");h.textContent=title;const p=document.createElement("p");p.textContent=body;
  const b=document.createElement("button");b.className="primary";b.textContent="دریافت به‌روزرسانی";
  b.addEventListener("click",async()=>{b.disabled=true;b.textContent="در حال دریافت...";try{const reg=await navigator.serviceWorker?.getRegistration();await reg?.update();if(reg?.waiting)reg.waiting.postMessage({type:"SKIP_WAITING"});setTimeout(()=>location.reload(),1200)}catch(e){b.disabled=false;b.textContent="تلاش دوباره";toast("به‌روزرسانی انجام نشد؛ از صفحه نصب اقدام کنید.")}});
  const n=document.createElement("button");n.className="secondary";n.textContent=localStorage.getItem("mmd_update_notifications")==="on"?"اعلان انتشار نسخه فعال است":"فعال‌سازی اعلان انتشار نسخه";
  n.addEventListener("click",async()=>{if(!("Notification"in window)){toast("این مرورگر از اعلان پشتیبانی نمی‌کند.");return}const permission=await Notification.requestPermission();if(permission==="granted"){localStorage.setItem("mmd_update_notifications","on");n.textContent="اعلان انتشار نسخه فعال شد";toast("از این پس هنگام بازکردن برنامه، انتشار نسخه جدید با اعلان اطلاع‌رسانی می‌شود.")}else toast("اجازه اعلان داده نشد.")});
  wrap.append(h,p,b,n);document.querySelector(".main")?.prepend(wrap);
 }catch(e){console.warn("Update notice unavailable",e)}
}
let updateMonitorStarted=false;
function startUpdateMonitor(){
 if(updateMonitorStarted)return;updateMonitorStarted=true;
 setInterval(async()=>{
  try{
   const r=await fetch("./version.json?poll="+Date.now(),{cache:"no-store"});if(!r.ok)return;
   const v=await r.json(),seen=localStorage.getItem("mmd_seen_version");
   if(v.version&&seen&&seen!==String(v.version))checkAppUpdateNotice();
   const reg=await navigator.serviceWorker?.getRegistration();await reg?.update();
  }catch(e){console.debug("Update check skipped",e)}
 },10*60*1000);
}
async function waitForStartup(promise,label,ms=12000){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error("زمان دریافت "+label+" بیش از حد طول کشید. اتصال اینترنت را بررسی و دوباره تلاش کنید.")),ms)})])}finally{clearTimeout(timer)}}
async function enterApp(user){
 if(enteringUserId===user.id)return;enteringUserId=user.id;
 try{
  currentUser=user;
 if(user.id===PERSONAL_ADMIN_ID||user.id===PERSONAL_SECOND_ID)await saveCurrentPersonalSession();
 setupPersonalSwitcher();
 show("auth-view",false);show("expired-subscription-view",false);show("app-view",true);$("today-date").textContent=dateLabel();
  await waitForStartup(loadProfile(),"اطلاعات حساب");if(!currentUser)return;
  await waitForStartup(loadFeatureFlags(),"تنظیمات سامانه");
  if(profile?.is_approved===false){show("app-view",false);show("auth-view",false);show("pending-approval-view",true);return;}
  const startupResults=await Promise.allSettled([waitForStartup(loadTasks(),"وظایف"),waitForStartup(loadRoutines(),"برنامه ثابت"),waitForStartup(loadSettings(),"تنظیمات شخصی"),waitForStartup(loadAnnouncements(),"اطلاعیه‌ها"),waitForStartup(loadHumorFeed(),"بخش همتانه",7000)]);const startupNames=["وظایف","برنامه ثابت","تنظیمات","اطلاعیه‌ها","بخش همتانه"];const startupErrors=startupResults.map((r,i)=>r.status==="rejected"?startupNames[i]+": "+(r.reason?.message||"خطای دریافت اطلاعات"):null).filter(Boolean);if(startupResults[0].status==="rejected")tasks=[];if(startupResults[1].status==="rejected")routines=[];if(startupResults[2].status==="rejected")settings={};if(startupResults[3].status==="rejected")window.__announcements=[];renderAll();syncSmartPlanner();try{startAnnouncementRealtime()}catch(e){console.warn("Announcement realtime unavailable",e)}startMessageRealtime().catch(e=>console.warn("Message realtime unavailable",e));try{startChatRealtime()}catch(e){console.warn("Chat realtime unavailable",e)}try{startCommunityRealtime()}catch(e){console.warn("Community realtime unavailable",e)}checkAppUpdateNotice();notifyUnreadMessagesOnEntry().catch(e=>console.warn("Unread message check unavailable",e));startUpdateMonitor();if(startupErrors.length){console.error("Some startup data failed:",startupErrors);toast("برنامه باز شد، اما دریافت بعضی اطلاعات ناموفق بود: "+startupErrors.join(" | "))}
 }catch(err){console.error("App loading failed:",err);show("app-view",false);show("auth-view",true);show("login-card",true);message("auth-message","خطا در ورود: "+(err.message||"خطای نامشخص"),true);throw err}
 finally{enteringUserId=null}
}
async function loadFeatureFlags(){
 const {data,error}=await db.from("app_feature_flags").select("chat_enabled,humor_enabled,humor_requires_approval").eq("id",1).single();
 if(error)throw error;
 featureFlags={chat_enabled:data.chat_enabled!==false,humor_enabled:data.humor_enabled!==false,humor_requires_approval:data.humor_requires_approval!==false};
 applyFeatureFlags();
}
function applyFeatureFlags(){
 $("chat-nav").classList.toggle("hidden",!featureFlags.chat_enabled&&!profile?.is_admin);
 document.querySelectorAll('[data-page="humor"]').forEach(b=>b.classList.toggle("hidden",!featureFlags.humor_enabled&&!profile?.is_admin));
 if($("feature-chat-toggle"))$("feature-chat-toggle").checked=featureFlags.chat_enabled;
 if($("feature-humor-toggle"))$("feature-humor-toggle").checked=featureFlags.humor_enabled;
 if($("feature-humor-approval-toggle"))$("feature-humor-approval-toggle").checked=featureFlags.humor_requires_approval;
 if(!featureFlags.chat_enabled&&!profile?.is_admin)stopChatRealtime();
 if(!featureFlags.humor_enabled&&!profile?.is_admin){$("humor-feed").textContent="این بخش موقتاً غیرفعال است.";const f=$("humor-submit-form");if(f)f.classList.add("hidden");}
 else {const f=$("humor-submit-form");if(f)f.classList.remove("hidden");}
}
$("feature-flags-form")?.addEventListener("submit",async e=>{
 e.preventDefault();const b=e.submitter;if(b)b.disabled=true;
 try{
  if(!isManagementAdmin())throw new Error("فقط حساب مدیر اصلی می‌تواند تنظیمات سامانه را تغییر دهد.");
  const nextFlags={chat_enabled:$("feature-chat-toggle").checked,humor_enabled:$("feature-humor-toggle").checked,humor_requires_approval:$("feature-humor-approval-toggle").checked,updated_at:new Date().toISOString(),updated_by:currentUser.id};
  const {data:savedFlags,error}=await db.from("app_feature_flags").update(nextFlags).eq("id",1).select("id,chat_enabled,humor_enabled,humor_requires_approval").maybeSingle();
  if(error)throw error;
  if(!savedFlags)throw new Error("هیچ ردیفی ذخیره نشد؛ دسترسی مدیر یا سیاست امنیتی پایگاه داده را بررسی کن.");
  featureFlags={chat_enabled:savedFlags.chat_enabled!==false,humor_enabled:savedFlags.humor_enabled!==false,humor_requires_approval:savedFlags.humor_requires_approval!==false};
  applyFeatureFlags();
  await loadHumorFeed();
  if(isManagementAdmin())await loadAdminHumor();
  toast("تنظیمات ذخیره و از پایگاه داده تأیید شد. مطالب قبلیِ در انتظار بررسی، همچنان در صف مدیر می‌مانند.");
 }catch(x){
  try{await loadFeatureFlags()}catch(_){}
  toast(x.message||"ذخیره تنظیمات ناموفق بود.");
 }
 finally{if(b)b.disabled=false}
});

async function loadProfile(){
 const {data,error}=await db.from("profiles").select("id,display_name,is_admin,is_approved,is_banned,account_type,avatar_path,avatar_emoji,chat_enabled,bio,profile_color,school_grade,school_class").eq("id",currentUser.id).maybeSingle();
 if(error)throw error;profile=data||{display_name:"کاربر",is_admin:false,is_banned:false,account_type:"student",school_grade:null,school_class:null,avatar_path:null};if(!profile.account_type)profile.account_type="student";
 if(profile.is_approved===false){show("app-view",false);show("auth-view",false);show("pending-approval-view",true);return;}
 if(profile.is_banned){show("app-view",false);show("auth-view",false);show("expired-subscription-view",false);show("banned-account-view",true);$("banned-user-name").textContent=profile.display_name||"کاربر";return}
 $("user-name").textContent=profile.display_name||"کاربر";if(profile.avatar_path){const avatarUrl=db.storage.from("profile-avatars").getPublicUrl(profile.avatar_path).data.publicUrl+"?v="+Date.now();$("user-avatar").innerHTML='<img src="'+avatarUrl+'" alt="تصویر پروفایل">'}else{$("user-avatar").textContent="👤"}$("school-grade-chip").textContent=schoolProfileLabel(profile)||"پایه یا کلاس ثبت نشده";
 show("admin-nav",isManagementAdmin());show("announcement-admin-form",isManagementAdmin());show("chat-nav",profile.chat_enabled!==false||isManagementAdmin());
 if(isManagementAdmin()){$("subscription-label").textContent="مدیر سامانه";loadPendingUsers().catch(console.error);loadAdminHumor().catch(console.error);return;}
 const {data:subs,error:subError}=await db.from("subscriptions").select("starts_at,ends_at").eq("user_id",currentUser.id).order("ends_at",{ascending:false}).limit(1);
 if(subError)throw subError;
 const sub=subs?.[0],now=Date.now();
 if(!sub||new Date(sub.starts_at)>now||new Date(sub.ends_at)<now){$("subscription-label").textContent="اشتراک فعال نیست";show("app-view",false);show("auth-view",false);show("expired-subscription-view",true);$("expired-user-name").textContent=profile.display_name||"کاربر";$("expired-subscription-date").textContent=sub?.ends_at?"تاریخ پایان اشتراک: "+jalaliDate(sub.ends_at):"برای این حساب اشتراک فعالی ثبت نشده است.";return}
 $("subscription-label").textContent="اشتراک فعال تا "+jalaliDate(sub.ends_at);
}
async function loadTasks(){const {data,error}=await db.from("study_tasks").select("*").eq("user_id",currentUser.id).order("position").order("created_at",{ascending:false});if(error)throw error;tasks=data||[]}
async function loadRoutines(){const {data,error}=await db.from("routines").select("*").eq("user_id",currentUser.id).order("weekday").order("scheduled_time");if(error)throw error;routines=data||[]}
async function loadSettings(){const {data,error}=await db.from("planner_settings").select("*").eq("user_id",currentUser.id).maybeSingle();if(error)throw error;settings=data||{}}
function renderAll(){if(!currentUser)return;weeklyAvailability=settings.weekly_availability||{};weeklyPlan=Array.isArray(settings.weekly_plan)?settings.weekly_plan:[];renderPlannerAvailability();renderWeeklyPlan();renderAnnouncements();renderTasks();renderRoutines();renderReports();syncProfileForm();$("welcome-title").textContent="سلام "+(profile.display_name||"")+", برنامه امروزت آماده است."; $("display-name").value=profile.display_name||"";$("sleep-hours").value=settings.sleep_hours??"";$("wake-time").value=settings.wake_time?.slice(0,5)||"";$("accent-theme").value=settings.accent_theme||"emerald";$("appearance").value=settings.appearance||settings.theme||"light";$("season-theme").value=settings.season_theme||"auto";$("humor-enabled").checked=!!settings.humor_enabled;applyTheme(settings.accent_theme||"emerald",settings.appearance||settings.theme||"light",settings.season_theme||"auto");updateHumor()}
function taskMarkup(t){const done=t.status==="done";const due=t.due_at?jalaliDate(t.due_at,true):"بدون مهلت";return '<article class="task-item '+(done?'done':'')+'"><input class="task-check" type="checkbox" data-task-check="'+t.id+'" '+(done?'checked':'')+' aria-label="تغییر وضعیت"><div class="task-main"><h3>'+escapeHtml(t.title)+'</h3><p>'+escapeHtml(t.description||"")+' · '+due+'</p></div><span class="priority '+(t.priority==="high"?"high":"")+'">'+(t.priority==="high"?"زیاد":t.priority==="low"?"کم":"معمولی")+'</span><div class="task-actions"><button class="icon-btn" data-task-delete="'+t.id+'">حذف</button></div></article>'}
function renderTodayWork(){
 const today=tasks.filter(t=>isToday(t.due_at)||(!t.due_at&&t.status==="pending"));
 $("today-tasks").innerHTML=today.length?today.map(taskMarkup).join(""):'<div class="empty">برای امروز وظیفه‌ای ثبت نشده است.</div>';
 $("daily-task-list").innerHTML=today.length?today.map(taskMarkup).join(""):'<div class="empty">برای امروز وظیفه‌ای ثبت نشده است.</div>';
 const done=today.filter(t=>t.status==="done").length;
 $("daily-total").textContent=fa(today.length);$("daily-done").textContent=fa(done);$("daily-pending").textContent=fa(today.length-done);
 const weekday=new Date().getDay(),todayRoutines=routines.filter(r=>Number(r.weekday)===weekday).sort((a,b)=>(a.scheduled_time||"").localeCompare(b.scheduled_time||""));
 $("daily-routine-list").innerHTML=todayRoutines.length?todayRoutines.map(r=>'<article class="routine-card"><b>'+escapeHtml(r.title)+'</b><small>'+(r.scheduled_time?r.scheduled_time.slice(0,5):"بدون ساعت")+'</small><p class="muted">'+escapeHtml(r.details||"")+'</p></article>').join(""):'<div class="empty">برای امروز برنامه ثابتی ثبت نشده است.</div>';
}
function renderTasks(){
 const filtered=tasks.filter(t=>taskFilter==="all"||t.status===taskFilter);
 $("all-tasks").innerHTML=filtered.length?filtered.map(taskMarkup).join(""):'<div class="empty">وظیفه‌ای در این بخش وجود ندارد.</div>';
 renderTodayWork();
 $("stat-total").textContent=fa(tasks.length);$("stat-done").textContent=fa(tasks.filter(t=>t.status==="done").length);$("stat-pending").textContent=fa(tasks.filter(t=>t.status==="pending").length);
 const pct=tasks.length?Math.round(tasks.filter(t=>t.status==="done").length/tasks.length*100):0;$("today-percent").textContent=fa(pct)+"٪";$("today-ring").style.background="radial-gradient(circle at center,var(--panel) 57%,transparent 59%),conic-gradient(var(--accent) "+pct+"%,#314157 0)";
}
function renderRoutines(){$("routine-list").innerHTML=routines.length?routines.map(r=>'<article class="routine-card"><b>'+escapeHtml(r.title)+'</b><small>'+weekdays[r.weekday]+' · '+(r.scheduled_time?r.scheduled_time.slice(0,5):"بدون ساعت")+'</small><p class="muted">'+escapeHtml(r.details||"")+'</p><button class="icon-btn" data-routine-delete="'+r.id+'">حذف</button></article>').join(""):'<div class="empty">هنوز برنامه ثابتی ثبت نشده است.</div>'}
function renderReports(){const total=tasks.length,done=tasks.filter(t=>t.status==="done").length,cancelled=tasks.filter(t=>t.status==="cancelled").length,pct=total?Math.round(done/total*100):0;$("report-percent").textContent=fa(pct)+"٪";$("report-total").textContent=fa(total);$("report-done").textContent=fa(done);$("report-cancelled").textContent=fa(cancelled)}
async function refreshTasks(){await loadTasks();renderTasks();renderReports()}
$("task-form").addEventListener("submit",async e=>{e.preventDefault();const title=$("task-title").value.trim();const due=$("task-due-date").value,time=$("task-due-time").value||"23:59";if($("task-due-date-jalali").value&&!due){toast("تقویم بارگذاری نشده یا تبدیل تاریخ انجام نشد؛ صفحه را تازه‌سازی کنید.");return}let dueAt=null;if(due){const d=new Date(due+"T00:00:00");if(Number.isNaN(d.getTime())){toast("تاریخ انتخاب‌شده معتبر نیست.");return}const [hh,mm]=time.split(":").map(Number);d.setHours(hh,mm,0,0);dueAt=d.toISOString()}const estimate=Number($("task-estimated-minutes").value);if(!Number.isInteger(estimate)||estimate<5||estimate>1440){toast("مدت‌زمان باید بین ۵ تا ۱۴۴۰ دقیقه باشد.");return}const row={user_id:currentUser.id,title,description:$("task-description").value.trim(),priority:$("task-priority").value,status:"pending",position:tasks.length,estimated_minutes:estimate,schedule_locked:false,...(dueAt?{due_at:dueAt}:{})};const {error}=await db.from("study_tasks").insert(row);if(error){toast(error.message);return}e.target.reset();await refreshTasks();await generateWeeklyPlan(true);toast("وظیفه ثبت شد و برنامه هفته به‌روزرسانی شد.")});
$("routine-form").addEventListener("submit",async e=>{e.preventDefault();const row={user_id:currentUser.id,title:$("routine-title").value.trim(),details:$("routine-details").value.trim(),weekday:Number($("routine-weekday").value),scheduled_time:$("routine-time").value||null};const {error}=await db.from("routines").insert(row);if(error){toast(error.message);return}e.target.reset();await loadRoutines();renderRoutines();toast("برنامه ثابت اضافه شد.")});
document.addEventListener("click",async e=>{
 const profileBack=e.target.closest('#page-public-profile [data-page="humor"]');
 if(profileBack){navigate("humor");return}

 const check=e.target.closest("[data-task-check]");if(check){const id=check.dataset.taskCheck;const {error}=await db.from("study_tasks").update({status:check.checked?"done":"pending"}).eq("id",id).eq("user_id",currentUser.id);if(error)toast(error.message);else{await refreshTasks();await generateWeeklyPlan(true)}return}
 const del=e.target.closest("[data-task-delete]");if(del){if(!confirm("این وظیفه حذف شود؟"))return;const {error}=await db.from("study_tasks").delete().eq("id",del.dataset.taskDelete).eq("user_id",currentUser.id);if(error)toast(error.message);else{await refreshTasks();toast("وظیفه حذف شد.")}return}
 const rd=e.target.closest("[data-routine-delete]");if(rd){if(!confirm("این برنامه حذف شود؟"))return;const {error}=await db.from("routines").delete().eq("id",rd.dataset.routineDelete).eq("user_id",currentUser.id);if(error)toast(error.message);else{await loadRoutines();renderRoutines();toast("برنامه حذف شد.")}return}
 const go=e.target.closest("[data-go]");if(go)navigate(go.dataset.go);
 const thread=e.target.closest("[data-chat-user]");if(thread){chatTargetUserId=thread.dataset.chatUser;loadSupportChat().catch(err=>message("chat-message",err.message,true));return}
 const nav=e.target.closest("[data-page]");if(nav)navigate(nav.dataset.page);
});

let chatChannel=null,chatTargetUserId=null,messageNoticeChannel=null;
const PUSH_PUBLIC_KEY="BA18A8ln4zGToMNrHhAT5Q72Vbp-PXFWKTxHqCXDlH_p3xXpqJgha3kvMxY_VYCQuDLHf15xpmOLeG-6w-7aW8E";
function base64UrlToBytes(value){const padding="=".repeat((4-value.length%4)%4);const raw=atob((value+padding).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}
let notificationAudioContext=null;
function playShortNotificationTone(){
 try{
  const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
  if(!notificationAudioContext)notificationAudioContext=new Ctx();
  if(notificationAudioContext.state==="suspended")notificationAudioContext.resume();
  const osc=notificationAudioContext.createOscillator(),gain=notificationAudioContext.createGain(),now=notificationAudioContext.currentTime;
  osc.type="sine";osc.frequency.setValueAtTime(880,now);osc.frequency.exponentialRampToValueAtTime(660,now+.16);
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.12,now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+.19);
  osc.connect(gain);gain.connect(notificationAudioContext.destination);osc.start(now);osc.stop(now+.2);
 }catch(e){console.debug("Notification tone unavailable",e)}
}
async function notifyLiveEvent(title,body,tag,url){
 if(document.visibilityState==="visible"){playShortNotificationTone();toast(body)}
 if(!("Notification"in window)||Notification.permission!=="granted")return;
 try{
  const reg=await navigator.serviceWorker?.getRegistration();
  if(reg)await reg.showNotification(title,{body,icon:"./assets/icon.svg",badge:"./assets/icon-192.svg",tag,renotify:true,vibrate:[100,50,100],data:{url}});
  else new Notification(title,{body,tag});
 }catch(err){console.debug("Browser notification unavailable; in-page notice was shown",err)}
}
async function syncPushStatus(){
 const el=$("push-status");if(!el)return;
 if(!("Notification"in window)||!window.isSecureContext){el.textContent="این مرورگر از اعلان پشتیبانی نمی‌کند.";return}
 const reg=await navigator.serviceWorker?.getRegistration();const sub=await reg?.pushManager?.getSubscription();
 el.textContent=sub?"اعلان پیام‌ها، اطلاعیه‌ها و همتانه فعال است.":Notification.permission==="denied"?"اعلان‌ها در تنظیمات مرورگر مسدود شده‌اند.":"اعلان پیام‌ها، اطلاعیه‌ها و مطالب همتانه هنوز فعال نشده است.";
}
async function enablePushNotifications(){
 const btn=$("enable-push");btn.disabled=true;
 try{
  const AudioContextCtor=window.AudioContext||window.webkitAudioContext;
  if(AudioContextCtor){if(!notificationAudioContext)notificationAudioContext=new AudioContextCtor();if(notificationAudioContext.state==="suspended")notificationAudioContext.resume().catch(()=>{})}
  if(!("Notification"in window)||!window.isSecureContext||!("serviceWorker"in navigator))throw new Error("مرورگر یا اتصال امن از اعلان پشتیبانی نمی‌کند.");
  const permission=await Notification.requestPermission();if(permission!=="granted")throw new Error("اجازه اعلان داده نشد. از تنظیمات مرورگر، اعلان‌ها را فعال کن.");
  const reg=await navigator.serviceWorker.register("./service-worker.js");let sub=await reg.pushManager.getSubscription();
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:base64UrlToBytes(PUSH_PUBLIC_KEY)});
  const {error}=await db.functions.invoke("push-notify",{body:{action:"subscribe",subscription:sub.toJSON()}});if(error)throw error;
  toast("اعلان چت، اطلاعیه‌ها و همتانه فعال شد.");await syncPushStatus();
 }catch(err){console.error("Push setup failed",err);toast(err.message||"فعال‌سازی اعلان ناموفق بود.");await syncPushStatus()}
 finally{btn.disabled=false}
}
$("enable-push")?.addEventListener("click",enablePushNotifications);
async function testPushNotification(){
 const btn=$("test-push");if(btn)btn.disabled=true;
 try{
  const {data,error}=await db.functions.invoke("push-notify",{body:{action:"test"}});
  if(error)throw error;
  if(!data?.ok)throw new Error(data?.error||"ارسال اعلان آزمایشی ناموفق بود.");
  toast("اعلان آزمایشی ارسال شد؛ اعلان‌های مرورگر را بررسی کن.");
 }catch(err){console.error("Push test failed",err);toast(err.message||"ارسال اعلان آزمایشی ناموفق بود.")}
 finally{if(btn)btn.disabled=false}
}
$("test-push")?.addEventListener("click",testPushNotification);
async function startMessageRealtime(){
 if(messageNoticeChannel){await db.removeChannel(messageNoticeChannel);messageNoticeChannel=null}
 if(!currentUser)return;
 messageNoticeChannel=db.channel("mmd-message-notices").on("postgres_changes",{event:"INSERT",schema:"public",table:"private_messages"},async payload=>{
  const msg=payload.new;if(!msg||msg.sender_id===currentUser.id)return;
  try{const {data:conv,error}=await db.from("private_conversations").select("user_one,user_two").eq("id",msg.conversation_id).maybeSingle();if(error||!conv||![conv.user_one,conv.user_two].includes(currentUser.id))return;await notifyLiveEvent("پیام جدید در چت", "یک پیام جدید دریافت کردی.", "mmd-live-chat-"+msg.id, "./?page=chat");}
  catch(err){console.debug("Message notice skipped",err)}
 }).subscribe();
 syncPushStatus().catch(()=>{});
}
function stopMessageRealtime(){if(messageNoticeChannel){db.removeChannel(messageNoticeChannel);messageNoticeChannel=null}}

async function notifyUnreadMessagesOnEntry(){
 if(!currentUser)return;
 const {data:conversations,error:conversationError}=await db.from("private_conversations").select("id").or("user_one.eq."+currentUser.id+",user_two.eq."+currentUser.id);
 if(conversationError)throw conversationError;
 const ids=(conversations||[]).map(c=>c.id);if(!ids.length)return;
 const {data:unread,error}=await db.from("private_messages").select("id,conversation_id,sender_id").in("conversation_id",ids).neq("sender_id",currentUser.id).is("read_at",null).is("deleted_at",null);
 if(error)throw error;
 const count=unread?.length||0;
 if(count){toast("هنگام نبودنت "+fa(count)+" پیام جدید دریافت کردی. برای دیدن پیام‌ها وارد بخش چت شو.");const nav=$("chat-nav");if(nav){nav.dataset.unreadCount=String(count);nav.setAttribute("aria-label","چت؛ "+count+" پیام خوانده‌نشده");}}
}

function stopChatRealtime(){if(chatChannel){db.removeChannel(chatChannel);chatChannel=null}}
let communityChannel=null;
function stopCommunityRealtime(){if(communityChannel){db.removeChannel(communityChannel);communityChannel=null}}
const seenCommunityNotices=new Set();
function startCommunityRealtime(){
 stopCommunityRealtime();
 communityChannel=db.channel("mmd-community-feed")
 .on("postgres_changes",{event:"*",schema:"public",table:"humor_posts"},payload=>{
  if(!$("page-humor").classList.contains("hidden"))loadHumorFeed().catch(e=>toast(e.message));
  const post=payload.new;
  if(post?.status==="approved"&&post.user_id!==currentUser?.id&&!seenCommunityNotices.has(post.id)){
   seenCommunityNotices.add(post.id);
   notifyLiveEvent("مطلب تازه در همتانه",post.title||"یک مطلب تازه منتشر شد.","mmd-live-community-"+post.id,"./?page=humor").catch(()=>{});
  }
 })
 .on("postgres_changes",{event:"*",schema:"public",table:"humor_post_comments"},async payload=>{const c=payload.new;if(c?.user_id!==currentUser?.id){try{const {data:post}=await db.from("humor_posts").select("user_id").eq("id",c.post_id).maybeSingle();if(post?.user_id===currentUser.id)await notifyLiveEvent("دیدگاه تازه در همتانه",String(c.body||"یک دیدگاه تازه ثبت شد.").slice(0,120),"mmd-live-comment-"+c.id,"./?page=humor")}catch(err){console.debug("Comment notice skipped",err)}}if(!$("page-humor").classList.contains("hidden"))loadHumorFeed().catch(e=>toast(e.message))})
 .on("postgres_changes",{event:"*",schema:"public",table:"humor_post_likes"},()=>{if(!$("page-humor").classList.contains("hidden"))loadHumorFeed().catch(e=>toast(e.message))})
 .subscribe()
}
let chatOnlineUsers=new Set();let chatPeerId=null;
function updateChatPresence(){const x=$("chat-peer-status");if(x&&chatPeerId)x.textContent=chatOnlineUsers.has(chatPeerId)?"آنلاین":"آفلاین";document.querySelectorAll("[data-online-user]").forEach(n=>n.textContent=chatOnlineUsers.has(n.dataset.onlineUser)?"آنلاین":"آفلاین")}
function startChatRealtime(){stopChatRealtime();chatChannel=db.channel("private-chat",{config:{presence:{key:currentUser.id}}}).on("presence",{event:"sync"},()=>{const p=chatChannel.presenceState();chatOnlineUsers=new Set(Object.values(p).flat().map(v=>v.user_id));updateChatPresence()}).on("postgres_changes",{event:"*",schema:"public",table:"private_messages"},()=>{if(!$("page-chat").classList.contains("hidden")&&!$("chat-content").classList.contains("hidden"))loadSupportChat().catch(e=>message("chat-message",e.message,true))}).subscribe(async status=>{if(status==="SUBSCRIBED")await chatChannel.track({user_id:currentUser.id,online_at:new Date().toISOString()})})}
function chatProfileMeta(p){if(!p)return "پایه نامشخص";const grade=p.account_type==="teacher"?"معلم":(p.school_grade||"پایه نامشخص");return grade+(p.school_class?" · کلاس "+p.school_class:"")}
function renderChatDirectory(){
 const list=$("chat-directory-list");if(!list)return;
 const users=(window.__chatProfiles||[]).filter(p=>p&&p.id!==currentUser.id);
 list.innerHTML=users.map(p=>{const avatar=p.avatar_path?'<img src="'+escapeHtml(db.storage.from("profile-avatars").getPublicUrl(p.avatar_path).data.publicUrl)+'" alt="">':"👤";return '<button type="button" class="chat-directory-user" data-directory-user="'+p.id+'"><span class="chat-directory-avatar">'+avatar+'</span><span><b>'+escapeHtml(p.display_name||"کاربر")+'</b><small>'+escapeHtml(chatProfileMeta(p))+'</small></span></button>'}).join("")||'<div class="empty">کاربر دیگری ثبت‌نام نکرده است.</div>';
}
function showChatDirectory(){
 document.querySelectorAll("#chat-content > .chat-inbox,#chat-content > .chat-window").forEach(x=>x.classList.add("hidden"));
 $("chat-public-profile-view").classList.add("hidden");$("chat-directory-view").classList.remove("hidden");
 renderChatDirectory();$("chat-directory-search").value="";$("chat-directory-search").focus();
}
function showChatPublicProfile(userId){
 const p=(window.__chatProfiles||[]).find(x=>x.id===userId);if(!p)return;
 const avatar=p.avatar_path?'<img src="'+escapeHtml(db.storage.from("profile-avatars").getPublicUrl(p.avatar_path).data.publicUrl)+'" alt="">':"👤";
 const details=[chatProfileMeta(p),p.chat_enabled===false?"چت غیرفعال":"چت فعال"].map(x=>'<span>'+escapeHtml(x)+'</span>').join("");
 $("chat-public-profile-card").innerHTML='<div class="chat-public-avatar">'+avatar+'</div><h3>'+escapeHtml(p.display_name||"کاربر")+'</h3><div class="chat-public-profile-details">'+details+'</div><p>'+escapeHtml(p.bio||"این کاربر هنوز توضیحی برای پروفایل خود ثبت نکرده است.")+'</p><button type="button" class="primary" id="chat-start-with-user" data-user-id="'+p.id+'" '+(p.chat_enabled===false?"disabled":"")+'>'+(p.chat_enabled===false?"چت این کاربر غیرفعال است":"چت با این کاربر")+'</button>';
 $("chat-directory-view").classList.add("hidden");document.querySelectorAll("#chat-content > .chat-inbox,#chat-content > .chat-window").forEach(x=>x.classList.add("hidden"));$("chat-public-profile-view").classList.remove("hidden");
}
async function startChatWithUser(userId){
 const p=(window.__chatProfiles||[]).find(x=>x.id===userId);if(!p)return;
 if(p.chat_enabled===false){toast("امکان چت با این کاربر غیرفعال است.");return}
 $("chat-directory-view").classList.add("hidden");$("chat-public-profile-view").classList.add("hidden");
 document.querySelectorAll("#chat-content > .chat-inbox").forEach(x=>x.classList.add("hidden"));
 document.querySelectorAll("#chat-content > .chat-window").forEach(x=>x.classList.remove("hidden"));
 $("chat-content").classList.add("focused-chat");
 chatTargetUserId=userId;
 await loadSupportChat();
 $("chat-back-to-list")?.classList.remove("hidden");
}
$("chat-back-to-list")?.addEventListener("click",()=>{chatTargetUserId=null;chatPeerId=null;$("chat-content").classList.remove("focused-chat");$("chat-back-to-list").classList.add("hidden");$("chat-directory-view").classList.add("hidden");$("chat-public-profile-view").classList.add("hidden");document.querySelectorAll("#chat-content > .chat-inbox").forEach(x=>x.classList.remove("hidden"));document.querySelectorAll("#chat-content > .chat-window").forEach(x=>x.classList.add("hidden"));$("chat-heading-title").textContent="یک کاربر را انتخاب کنید";$("chat-peer-name").textContent="یک کاربر را انتخاب کنید";$("chat-peer-meta").textContent="گفت‌وگوی خصوصی بین دو کاربر";$("chat-peer-status").textContent="وضعیت نامشخص";$("chat-messages").innerHTML='<div class="empty">برای شروع، یک گفت‌وگو را انتخاب کنید.</div>'});
$("chat-find-user")?.addEventListener("click",showChatDirectory);
$("chat-directory-back")?.addEventListener("click",()=>{$("chat-directory-view").classList.add("hidden");document.querySelectorAll("#chat-content > .chat-inbox,#chat-content > .chat-window").forEach(x=>x.classList.remove("hidden"))});
$("chat-profile-back")?.addEventListener("click",()=>{$("chat-public-profile-view").classList.add("hidden");$("chat-directory-view").classList.remove("hidden")});
$("chat-directory-search")?.addEventListener("input",e=>{const q=e.target.value.trim().toLocaleLowerCase("fa");$("chat-directory-list").querySelectorAll("[data-directory-user]").forEach(x=>x.classList.toggle("hidden",!x.textContent.toLocaleLowerCase("fa").includes(q)))});
$("chat-directory-list")?.addEventListener("click",e=>{const b=e.target.closest("[data-directory-user]");if(b)startChatWithUser(b.dataset.directoryUser).catch(x=>message("chat-message",x.message,true))});
$("chat-public-profile-card")?.addEventListener("click",e=>{const b=e.target.closest("#chat-start-with-user");if(b)startChatWithUser(b.dataset.userId).catch(x=>message("chat-message",x.message,true))});
$("chat-inbox-list")?.addEventListener("click",e=>{const b=e.target.closest("[data-person]");if(b){startChatWithUser(b.dataset.person).catch(x=>message("chat-message",x.message,true));return}const c=e.target.closest("[data-conv]");if(c){const convId=c.dataset.conv;chatTargetUserId=convId;document.querySelectorAll("#chat-content > .chat-inbox").forEach(x=>x.classList.add("hidden"));document.querySelectorAll("#chat-content > .chat-window").forEach(x=>x.classList.remove("hidden"));$("chat-content").classList.add("focused-chat");$("chat-back-to-list")?.classList.remove("hidden");loadSupportChat().catch(x=>message("chat-message",x.message,true))}});
async function loadSupportChat(){
 if(!currentUser)return;
 if(profile?.chat_enabled===false&&!profile?.is_admin){show("chat-content",false);$("chat-status").textContent="دسترسی چت غیرفعال است.";return}
 show("chat-content",true);
 const {data:convs,error}=await db.from("private_conversations").select("*").order("created_at",{ascending:false});if(error)throw error;
 const {data:profiles,error:pe}=await db.from("public_profiles").select("id,display_name,chat_enabled,school_grade,school_class,account_type,avatar_path,bio");if(pe)throw pe;
 const names=new Map((profiles||[]).map(p=>[p.id,p.display_name||"کاربر"]));
 window.__chatProfiles=profiles||[];
 const list=$("chat-inbox-list");
 if(profile?.is_admin){list.innerHTML=(convs||[]).map(c=>'<button class="chat-thread" data-conv="'+c.id+'"><b>'+escapeHtml(names.get(c.user_one)||"کاربر")+" ↔ "+escapeHtml(names.get(c.user_two)||"کاربر")+'</b></button>').join("")||'<div class="empty">گفت‌وگویی نیست.</div>'}
 else {list.innerHTML=(profiles||[]).filter(p=>p.id!==currentUser.id&&p.chat_enabled!==false).map(p=>{const grade=p.account_type==="teacher"?"معلم":(p.school_grade||"پایه نامشخص");const cls=p.school_class?" · کلاس "+p.school_class:"";return '<button class="chat-thread" data-person="'+p.id+'"><b>'+escapeHtml(p.display_name||"کاربر")+'</b><small>'+escapeHtml(grade+cls)+'</small></button>'}).join("")||'<div class="empty">کاربر دیگری در دسترس نیست.</div>'}
 if(!chatTargetUserId&&profile?.is_admin&&convs?.length)chatTargetUserId=convs[0].id;
 let conv=(convs||[]).find(c=>c.id===chatTargetUserId);
 if(!conv&&chatTargetUserId&&chatTargetUserId!==currentUser.id){const peerId=chatTargetUserId;const pair=currentUser.id<peerId?[currentUser.id,peerId]:[peerId,currentUser.id];const findConversation=()=>db.from("private_conversations").select("*").eq("user_one",pair[0]).eq("user_two",pair[1]).maybeSingle();const q=await findConversation();if(q.error)throw q.error;conv=q.data;if(!conv){const r=await db.from("private_conversations").insert({user_one:pair[0],user_two:pair[1]}).select().single();if(r.error){if(r.error.code==="23505"){const retry=await findConversation();if(retry.error)throw retry.error;conv=retry.data;if(!conv)throw r.error}else throw r.error}else conv=r.data}}
 if(!conv){$("chat-heading-title").textContent="یک کاربر را انتخاب کنید";$("chat-messages").innerHTML="برای شروع یک کاربر را انتخاب کنید.";return}
 chatTargetUserId=conv.id;$("chat-back-to-list")?.classList.remove("hidden");const other=conv.user_one===currentUser.id?conv.user_two:conv.user_one;chatPeerId=other;const peer=(profiles||[]).find(p=>p.id===other);$("chat-heading-title").textContent=names.get(other)||"گفت‌وگو";$("chat-peer-name").textContent=peer?.display_name||"کاربر";$("chat-peer-meta").textContent=(peer?.account_type==="teacher"?"معلم":(peer?.school_grade||"پایه نامشخص"))+(peer?.school_class?" · کلاس "+peer.school_class:"")+(peer?.bio?" · "+peer.bio:"");$("chat-peer-status").textContent=chatOnlineUsers.has(other)?"آنلاین":"آفلاین";const av=$("chat-peer-avatar");if(peer?.avatar_path)av.innerHTML='<img src="'+db.storage.from("profile-avatars").getPublicUrl(peer.avatar_path).data.publicUrl+'" alt="">';else av.textContent="👤";
 const {data:msgs,error:me}=await db.from("private_messages").select("*").eq("conversation_id",conv.id).order("created_at");if(me)throw me;
 const unread=(msgs||[]).filter(m=>m.sender_id!==currentUser.id&&!m.read_at&&!m.deleted_at);
 if(unread.length){const readAt=new Date().toISOString();const {error:readError}=await db.from("private_messages").update({read_at:readAt}).in("id",unread.map(m=>m.id)).eq("conversation_id",conv.id).neq("sender_id",currentUser.id);if(readError)throw readError;unread.forEach(m=>m.read_at=readAt)}
 const rendered=await Promise.all((msgs||[]).map(async m=>{let media="";if(m.media_path&&!m.deleted_at){const z=await db.storage.from("private-chat-media").createSignedUrl(m.media_path,1800);if(z.data?.signedUrl){const u=z.data.signedUrl;if((m.media_type||"").startsWith("image/"))media='<a class="chat-image-open" href="'+u+'" target="_blank" rel="noopener"><img src="'+u+'" loading="lazy" style="max-width:280px;max-height:300px" alt="تصویر پیام" onerror="this.parentElement.textContent=\'نمایش تصویر ممکن نیست\'"></a>';else if((m.media_type||"").startsWith("video/"))media='<video controls playsinline src="'+u+'" style="max-width:240px"></video>';else media='<a href="'+u+'" target="_blank">مشاهده فایل</a>'}}return '<article class="chat-bubble '+(m.sender_id===currentUser.id?'mine':'theirs')+'"><p>'+(m.deleted_at?"پیام حذف شده":escapeHtml(m.body||""))+'</p>'+media+'<small>'+new Intl.DateTimeFormat('fa-IR',{hour:'2-digit',minute:'2-digit'}).format(new Date(m.created_at))+(!m.deleted_at&&(m.sender_id===currentUser.id||profile?.is_admin)?(m.sender_id===currentUser.id?(m.read_at?' · <span class="chat-read">خوانده شد ✓✓</span>':' · <span class="chat-sent">ارسال شد ✓</span>')+' · ':'')+'<button class="chat-delete" data-delete-msg="'+m.id+'">حذف</button>':'')+'</small></article>'}));
 $("chat-messages").innerHTML=rendered.join("");$("chat-messages").scrollTop=$("chat-messages").scrollHeight;
}
document.querySelector(".chat-peer-card")?.addEventListener("click",()=>{const p=(window.__chatProfiles||[]).find(x=>x.id===chatPeerId);if(!p)return;const grade=p.account_type==="teacher"?"معلم":(p.school_grade||"پایه نامشخص");const cls=p.school_class?" · کلاس "+p.school_class:"";alert((p.display_name||"کاربر")+"\n"+grade+cls+"\n"+(p.bio||"معرفی‌ای ثبت نشده است."))});
$("chat-search")?.addEventListener("input",e=>{const q=e.target.value.trim().toLocaleLowerCase("fa");$("chat-inbox-list").querySelectorAll(".chat-thread").forEach(x=>x.classList.toggle("hidden",!x.textContent.toLocaleLowerCase("fa").includes(q)))});

let chatPreviewUrl=null;
function clearChatFilePreview(){if(chatPreviewUrl){URL.revokeObjectURL(chatPreviewUrl);chatPreviewUrl=null}const box=$("chat-file-preview");if(box){box.innerHTML="";box.classList.add("hidden")}}
$("chat-file")?.addEventListener("change",e=>{clearChatFilePreview();const file=e.target.files?.[0];if(!file)return;const box=$("chat-file-preview");if(!box)return;box.classList.remove("hidden");const name=document.createElement("span");name.textContent=file.name;box.append(name);if(file.type.startsWith("image/")){chatPreviewUrl=URL.createObjectURL(file);const img=document.createElement("img");img.src=chatPreviewUrl;img.alt="پیش‌نمایش تصویر انتخاب‌شده";box.prepend(img)}const remove=document.createElement("button");remove.type="button";remove.textContent="×";remove.setAttribute("aria-label","حذف فایل انتخاب‌شده");remove.addEventListener("click",()=>{$("chat-file").value="";clearChatFilePreview()});box.append(remove)});
$("chat-form").addEventListener("submit",async e=>{e.preventDefault();if(!chatTargetUserId)return;const btn=e.submitter||$("chat-form").querySelector('button[type="submit"]'),body=$("chat-input").value.trim(),file=$("chat-file").files[0];if(!body&&!file)return;if(btn)btn.disabled=true;try{let path=null,type=null;if(file){if(file.size>52428800)throw Error("حداکثر حجم فایل ۵۰ مگابایت است.");path=currentUser.id+"/"+makeUUID()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");const compressed=await compressUploadFile(file);path=currentUser.id+"/"+makeUUID()+"-"+compressed.name.replace(/[^a-zA-Z0-9._-]/g,"_");const up=await db.storage.from("private-chat-media").upload(path,compressed,{contentType:compressed.type});if(up.error)throw up.error;type=compressed.type}const messageId=makeUUID();const r=await db.from("private_messages").insert({id:messageId,conversation_id:chatTargetUserId,sender_id:currentUser.id,body,media_path:path,media_type:type});if(r.error)throw r.error;db.functions.invoke("push-notify",{body:{action:"send",conversation_id:chatTargetUserId,message_id:messageId}}).then(({error})=>{if(error)console.warn("Push send skipped",error)});$("chat-input").value="";$("chat-file").value="";clearChatFilePreview();await loadSupportChat()}catch(x){message("chat-message",x.message,true)}finally{if(btn)btn.disabled=false}});
$("chat-messages").addEventListener("click",async e=>{const ab=e.target.closest("[data-admin-delete-msg]");const b=e.target.closest("[data-delete-msg]");if(!ab&&!b)return;const id=ab?.dataset.adminDeleteMsg||b?.dataset.deleteMsg;if(ab&&!profile?.is_admin){message("chat-message","دسترسی حذف مدیریتی ندارید.",true);return}if(!confirm(ab?"این پیام و پیوست آن برای هر دو طرف حذف شود؟":"پیام و پیوست آن حذف شود؟"))return;const btn=ab||b;btn.disabled=true;try{const q=await db.from("private_messages").select("id,sender_id,media_path").eq("id",id).maybeSingle();if(q.error)throw q.error;if(!q.data)throw new Error("پیام پیدا نشد یا قبلاً حذف شده است.");if(!ab&&q.data.sender_id!==currentUser.id)throw new Error("فقط پیام خودتان را می‌توانید حذف کنید.");if(q.data.media_path){const rm=await db.storage.from("private-chat-media").remove([q.data.media_path]);if(rm.error)throw rm.error}const d=await db.from("private_messages").delete().eq("id",id).select("id");if(d.error)throw d.error;if(!d.data?.length)throw new Error("حذف انجام نشد؛ مجوز پایگاه داده اجازه نداد.");await loadSupportChat();message("chat-message","پیام حذف شد.")}catch(err){console.error("Message delete failed",err);message("chat-message","حذف پیام ناموفق بود: "+err.message,true);btn.disabled=false}});

function navigate(page){if(page==="admin"&&!isManagementAdmin()){toast("دسترسی مدیریت کاربران برای این حساب فعال نیست.");page="today";} $("chat-content")?.classList.remove("focused-chat");if(page==="chat"&&!featureFlags.chat_enabled&&!profile?.is_admin){toast("بخش چت غیرفعال است.");page="today"}if(page==="humor"&&!featureFlags.humor_enabled&&!profile?.is_admin){toast("بخش همتانه غیرفعال است.");page="today"}document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));show("page-"+page,true);document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));const titles={"public-profile":"پروفایل کاربر",today:"امروز","today-work":"کارهای امروز",profile:"پروفایل من",announcements:"اعلانات",contact:"ارتباط با ادمین",chat:"چت",smart:"برنامه‌ریز هوشمند",tasks:"وظایف و تکالیف",routines:"برنامه ثابت",reports:"گزارش پیشرفت",settings:"تنظیمات",admin:"مدیریت کاربران"};if(page==="smart"&&!smartEnabled())page="today";$("page-title").textContent=titles[page]||"امروز";if(page==="admin")loadAdminUsers().catch(e=>message("admin-message",e.message,true));if(page==="chat"){chatTargetUserId=null;show("chat-content",true);loadSupportChat().then(startChatRealtime).catch(e=>message("chat-message",e.message,true))}else stopChatRealtime();if(page==="humor"){loadHumorFeed().catch(e=>toast(e.message))}}
document.querySelector("#page-public-profile [data-page=humor]")?.addEventListener("click",()=>navigate("humor"));
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{taskFilter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));renderTasks()}));
$("smart-planner-toggle").addEventListener("change",e=>{if(e.target.checked)localStorage.setItem(smartKey(),"on");else localStorage.removeItem(smartKey());syncSmartPlanner();toast(e.target.checked?"برنامه‌ریز هوشمند فعال شد.":"برنامه‌ریز هوشمند غیرفعال شد.");});

const plannerDayOrder=[6,0,1,2,3,4,5];
const plannerDayNames={0:"یکشنبه",1:"دوشنبه",2:"سه‌شنبه",3:"چهارشنبه",4:"پنجشنبه",5:"جمعه",6:"شنبه"};
const plannerBreakMinutes=10;
function plannerWeekStart(){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+1)%7));return d}
function plannerDateAt(offset){const d=plannerWeekStart();d.setDate(d.getDate()+offset);return d}
function plannerDateKey(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")}
function plannerOffsetForDate(d){return Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-plannerWeekStart())/86400000)}
const plannerDailyRestTotal=60,plannerDailyRestParts=6,plannerDailyRestPart=10;
function plannerRestIntervals(day,dateKey){
 const avail=weeklyAvailability[String(day)];if(!avail)return [];
 const start=plannerLocalDateTime(dateKey,avail.start),end=plannerLocalDateTime(dateKey,avail.end),span=end-start;
 const spanMinutes=span/60000;if(spanMinutes<plannerDailyRestTotal)return [];
 const count=Math.min(plannerDailyRestParts,Math.max(1,Math.floor((spanMinutes-plannerDailyRestTotal)/5)+1));
 const partMinutes=plannerDailyRestTotal/count,gap=(spanMinutes-plannerDailyRestTotal)/(count+1);
 const result=[];
 for(let i=1;i<=count;i++){
  let at=new Date(start.getTime()+(gap*i+partMinutes*(i-1))*60000);
  at.setMinutes(Math.round(at.getMinutes()/5)*5,0,0);
  const finish=new Date(at.getTime()+partMinutes*60000);
  if(at<start||finish>end)continue;
  result.push({id:"rest-"+dateKey+"-"+i,rest:true,startDate:at,endDate:finish,date:dateKey,duration:partMinutes});
 }
 return result;
}
function plannerDayOccupancy(day,dateKey,exceptId=null){
 return [...planEntriesForDate(dateKey,exceptId),...plannerRestIntervals(day,dateKey)].sort((a,b)=>a.startDate-b.startDate);
}
function plannerMinutes(value){if(!value)return null;const [h,m]=value.split(":").map(Number);return h*60+m}
function plannerLocalDateTime(dateKey,time){const [y,m,d]=dateKey.split("-").map(Number),[h,mi]=time.split(":").map(Number);return new Date(y,m-1,d,h,mi,0,0)}
function plannerTimeLabel(date){return new Intl.DateTimeFormat("fa-IR",{hour:"2-digit",minute:"2-digit"}).format(date)}
function renderPlannerAvailability(){
 const order=plannerDayOrder;
 order.forEach(day=>{const a=weeklyAvailability[String(day)]||{};const s=$("availability-start-"+day),e=$("availability-end-"+day);if(s)s.value=a.start||"";if(e)e.value=a.end||""});
}
async function savePlannerData(){
 const row={user_id:currentUser.id,sleep_hours:settings.sleep_hours??null,wake_time:settings.wake_time||null,theme:settings.theme||"light",accent_theme:settings.accent_theme||"emerald",appearance:settings.appearance||settings.theme||"light",humor_enabled:!!settings.humor_enabled,season_theme:settings.season_theme||"auto",weekly_availability:weeklyAvailability,weekly_plan:weeklyPlan};
 const {error}=await db.from("planner_settings").upsert(row,{onConflict:"user_id"});if(error)throw error;settings={...settings,...row};
}
async function saveWeeklyAvailability(){
 const next={};
 for(const day of plannerDayOrder){
  const start=$("availability-start-"+day).value,end=$("availability-end-"+day).value;
  if(!start&&!end)continue;
  if(!start||!end||plannerMinutes(start)>=plannerMinutes(end))throw new Error("برای "+plannerDayNames[day]+" ساعت شروع و پایان معتبر وارد کنید.");
  next[String(day)]={start,end};
 }
 weeklyAvailability=next;await savePlannerData();
}
function planTaskById(id){return tasks.find(t=>String(t.id)===String(id))}
function planEntriesForDate(dateKey,exceptId=null){return weeklyPlan.filter(p=>p.date===dateKey&&String(p.id||p.task_id)!==String(exceptId)).map(p=>({...p,startDate:new Date(p.start),endDate:new Date(p.end)})).sort((a,b)=>a.startDate-b.startDate)}
function plannerFindSlot(day,dateKey,duration,exceptId=null){
 const todayKey=plannerDateKey(new Date());if(dateKey<todayKey)return null;
 const avail=weeklyAvailability[String(day)];if(!avail)return null;
 const dayStart=plannerLocalDateTime(dateKey,avail.start),dayEnd=plannerLocalDateTime(dateKey,avail.end);
 let cursor=new Date(dayStart);const now=new Date();
 if(dateKey===plannerDateKey(now)&&cursor<now){cursor=new Date(now);cursor.setMinutes(Math.ceil(cursor.getMinutes()/15)*15,0,0)}
 const occupied=plannerDayOccupancy(day,dateKey,exceptId);
 for(const item of occupied){
  const buffer=item.rest?0:plannerBreakMinutes;
  const protectedStart=new Date(item.startDate.getTime()-buffer*60000);
  if(cursor<item.startDate){
   const proposedEnd=new Date(cursor.getTime()+duration*60000);
   if(proposedEnd<=protectedStart)break;
   cursor=new Date(item.endDate.getTime()+(item.rest?0:plannerBreakMinutes*60000));
  }else if(cursor<new Date(item.endDate.getTime()+buffer*60000)){
   cursor=new Date(item.endDate.getTime()+buffer*60000);
  }
 }
 if(cursor.getTime()+duration*60000>dayEnd.getTime())return null;
 return {start:cursor,end:new Date(cursor.getTime()+duration*60000)};
}
function plannerDueOffset(task){
 if(!task.due_at)return 6;
 const due=new Date(task.due_at);if(Number.isNaN(due.getTime()))return 6;
 return plannerOffsetForDate(due);
}
function plannerCandidateOffsets(task){
 const due=plannerDueOffset(task);
 if(!task.due_at||due>6)return {primary:[0,1,2,3,4,5,6],fallback:[]};
 if(due<0)return {primary:[],fallback:[]};
 const last=due===0?0:due-1,preferred=due>=2?due-2:0;
 const primary=[];for(let i=preferred;i>=0;i--)primary.push(i);
 const fallback=[];for(let i=preferred+1;i<=last;i++)fallback.push(i);
 return {primary,fallback};
}
function plannerChooseSlot(task,entries){
 const duration=Number(task.estimated_minutes);if(!Number.isFinite(duration)||duration<5)return null;
 const sets=plannerCandidateOffsets(task);
 const findChoices=offsets=>{
  const choices=[];
  for(const offset of offsets){
   const date=plannerDateAt(offset),dateKey=plannerDateKey(date),day=date.getDay();
   const slot=plannerFindSlot(day,dateKey,duration);
   if(slot&&(!task.due_at||slot.end<=new Date(task.due_at))){
    const used=entries.filter(p=>p.date===dateKey).reduce((n,p)=>n+Number(p.duration||0),0);
    const avail=weeklyAvailability[String(day)],capacity=plannerMinutes(avail.end)-plannerMinutes(avail.start);
    choices.push({dateKey,slot,ratio:capacity?used/capacity:1,offset});
   }
  }
  choices.sort((a,b)=>a.ratio-b.ratio||a.offset-b.offset||a.slot.start-b.slot.start);
  return choices[0]||null;
 };
 return findChoices(sets.primary)||findChoices(sets.fallback);
}
function renderWeeklyPlan(){
 const host=$("smart-plan-output");if(!host)return;
 const tasksById=new Map(tasks.map(t=>[String(t.id),t]));
 const valid=weeklyPlan.filter(p=>tasksById.has(String(p.task_id)));
 const assigned=new Map();for(const p of valid)assigned.set(String(p.task_id),(assigned.get(String(p.task_id))||0)+Number(p.duration||0));
 const unscheduled=tasks.filter(t=>t.status==="pending"&&(!t.estimated_minutes||(assigned.get(String(t.id))||0)<Number(t.estimated_minutes)));
 const groups=plannerDayOrder.map(day=>{
  const date=plannerDateAt((day-6+7)%7),key=plannerDateKey(date);
  const dayEntries=[...valid.filter(p=>p.date===key).map(p=>({...p,startDate:new Date(p.start),endDate:new Date(p.end)})),...plannerRestIntervals(day,key)].sort((a,b)=>a.startDate-b.startDate);
  const a=weeklyAvailability[String(day)];
  return '<section class="planner-day" data-plan-drop="'+key+'"><header><b>'+plannerDayNames[day]+'</b><span>'+jalaliDate(date)+'</span><small>'+(a?a.start+" تا "+a.end:"بدون زمان آزاد")+'</small></header><div class="planner-day-items">'+(dayEntries.length?dayEntries.map(p=>{
   if(p.rest)return '<article class="planner-task planner-rest"><div class="planner-task-top"><b>استراحت</b><span>'+plannerTimeLabel(p.startDate)+' · '+fa(p.duration)+' دقیقه</span></div><small>زمان استراحت روزانه</small></article>';
   const t=tasksById.get(String(p.task_id)),done=t?.status==="done",start=p.startDate,planKey=String(p.id||p.task_id);
   const part=p.segment_total>1?' · بخش '+fa(p.segment_index)+' از '+fa(p.segment_total):"";
   return '<article class="planner-task '+(done?"is-done":"")+'" draggable="'+(!done)+'" data-plan-key="'+escapeHtml(planKey)+'"><div class="planner-task-top"><b>'+escapeHtml(t?.title||"کار حذف‌شده")+'</b><span>'+plannerTimeLabel(start)+' · '+fa(p.duration)+' دقیقه'+part+'</span></div><small>مهلت: '+(t?.due_at?jalaliDate(t.due_at,true):"تعیین نشده")+(p.locked?" · جابه‌جایی دستی":"")+'</small><div class="planner-move-controls"><select aria-label="انتقال به روز" data-plan-day="'+escapeHtml(planKey)+'">'+plannerDayOrder.map(d=>{const dt=plannerDateAt((d-6+7)%7),k=plannerDateKey(dt);return '<option value="'+k+'" '+(k===key?"selected":"")+'>'+plannerDayNames[d]+'</option>'}).join("")+'</select><input aria-label="ساعت شروع" type="time" value="'+plannerTimeValue(start)+'" data-plan-time="'+escapeHtml(planKey)+'"><button type="button" class="secondary" data-plan-save="'+escapeHtml(planKey)+'" '+(done?"disabled":"")+'>تغییر زمان</button>'+(p.locked?'<button type="button" class="secondary" data-plan-unlock="'+escapeHtml(planKey)+'">خودکار</button>':"")+'</div></article>';
  }).join(""):'<p class="planner-empty">کاری برای این روز زمان‌بندی نشده است.</p>')+'</div></section>';
 }).join("");
 const invalidLocked=valid.filter(p=>p.locked).filter(p=>{const a=weeklyAvailability[String(new Date(p.date+"T12:00:00").getDay())],t=tasksById.get(String(p.task_id));if(!a)return true;const st=new Date(p.start),en=new Date(p.end),lo=plannerLocalDateTime(p.date,a.start),hi=plannerLocalDateTime(p.date,a.end);if(st<lo||en>hi||(t?.due_at&&en>new Date(t.due_at)))return true;return plannerDayOccupancy(new Date(p.date+"T12:00:00").getDay(),p.date,p.id||p.task_id).some(x=>st<new Date(x.endDate.getTime()+(x.rest?0:plannerBreakMinutes)*60000)&&en>new Date(x.startDate.getTime()-(x.rest?0:plannerBreakMinutes)*60000))});
 const conflictWarning=invalidLocked.length?'<section class="planner-unscheduled"><b>بررسی جابه‌جایی‌های دستی</b>'+invalidLocked.map(p=>'<p>'+escapeHtml(tasksById.get(String(p.task_id))?.title||"کار")+' — ساعت آزاد یا فاصله زمانی با برنامه جدید سازگار نیست؛ زمانش را اصلاح کن.</p>').join("")+'</section>':"";
 const warning=unscheduled.length?'<section class="planner-unscheduled"><b>نیازمند زمان‌بندی کامل</b>'+unscheduled.map(t=>{const done=assigned.get(String(t.id))||0,remaining=Math.max(0,Number(t.estimated_minutes||0)-done);return '<div class="planner-unscheduled-row"><p>'+escapeHtml(t.title)+' — '+(!t.estimated_minutes?"مدت‌زمان مشخص نشده":done?fa(done)+' از '+fa(t.estimated_minutes)+' دقیقه زمان‌بندی شد؛ '+fa(remaining)+' دقیقه باقی‌مانده':"زمان آزاد کافی تا مهلت پیدا نشد")+'</p>'+(!t.estimated_minutes?'<input type="number" min="5" max="1440" step="5" placeholder="دقیقه" aria-label="مدت‌زمان به دقیقه" data-plan-duration="'+escapeHtml(t.id)+'"><button type="button" class="secondary" data-plan-duration-save="'+escapeHtml(t.id)+'">ثبت مدت‌زمان</button>':"")+'</div>'}).join("")+'</section>':"";
 host.innerHTML='<div class="planner-week-grid">'+groups+'</div>'+conflictWarning+warning;
 host.querySelectorAll("[data-plan-drop]").forEach(el=>{el.addEventListener("dragover",e=>{e.preventDefault();el.classList.add("drag-over")});el.addEventListener("dragleave",()=>el.classList.remove("drag-over"));el.addEventListener("drop",async e=>{e.preventDefault();el.classList.remove("drag-over");const id=e.dataTransfer.getData("text/plain");if(id)await movePlannerTask(id,el.dataset.planDrop,null)})});
 host.querySelectorAll("[draggable=true]").forEach(el=>el.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/plain",el.dataset.planKey);e.dataTransfer.effectAllowed="move"}));
}
function plannerFindPartialSlot(day,dateKey,remaining,exceptPlanId=null){
 const todayKey=plannerDateKey(new Date());if(dateKey<todayKey)return null;
 const avail=weeklyAvailability[String(day)];if(!avail)return null;
 const dayStart=plannerLocalDateTime(dateKey,avail.start),dayEnd=plannerLocalDateTime(dateKey,avail.end);
 let cursor=new Date(dayStart);const now=new Date();
 if(dateKey===todayKey&&cursor<now){cursor=new Date(now);cursor.setMinutes(Math.ceil(cursor.getMinutes()/15)*15,0,0)}
 const occupied=plannerDayOccupancy(day,dateKey,exceptPlanId);
 const makeSlot=gapEnd=>{const gap=Math.floor((gapEnd-cursor)/60000),duration=Math.min(remaining,Math.floor(gap/5)*5);return duration>=5?{start:new Date(cursor),end:new Date(cursor.getTime()+duration*60000),duration}:null};
 for(const item of occupied){
  const buffer=item.rest?0:plannerBreakMinutes;
  if(cursor<item.startDate){const slot=makeSlot(new Date(item.startDate.getTime()-buffer*60000));if(slot)return slot;cursor=new Date(item.endDate.getTime()+buffer*60000)}
  else if(cursor<new Date(item.endDate.getTime()+buffer*60000))cursor=new Date(item.endDate.getTime()+buffer*60000);
 }
 return makeSlot(dayEnd);
}
function plannerChoosePartialSlot(task,entries,remaining,avoidDays=new Set()){
 const sets=plannerCandidateOffsets(task);
 const findChoices=offsets=>{
  const choices=[];
  for(const offset of offsets){
   const date=plannerDateAt(offset),dateKey=plannerDateKey(date),day=date.getDay();
   const slot=plannerFindPartialSlot(day,dateKey,remaining);
   if(slot&&(!task.due_at||slot.end<=new Date(task.due_at))){
    const used=entries.filter(p=>p.date===dateKey).reduce((n,p)=>n+Number(p.duration||0),0);
    const avail=weeklyAvailability[String(day)],capacity=plannerMinutes(avail.end)-plannerMinutes(avail.start);
    choices.push({dateKey,slot,ratio:capacity?used/capacity:1,offset,avoided:avoidDays.has(dateKey)});
   }
  }
  const fresh=choices.filter(c=>!c.avoided),pool=fresh.length?fresh:choices;
  pool.sort((a,b)=>a.ratio-b.ratio||a.offset-b.offset||b.slot.duration-a.slot.duration);
  return pool[0]||null;
 };
 return findChoices(sets.primary)||findChoices(sets.fallback);
}
function plannerTimeValue(date){return String(date.getHours()).padStart(2,"0")+":"+String(date.getMinutes()).padStart(2,"0")}
async function movePlannerTask(planId,dateKey,time){
 const entry=weeklyPlan.find(p=>String(p.id||p.task_id)===String(planId));if(!entry)return;
 const task=planTaskById(entry.task_id);if(!task||task.status==="done")return;
 const date=new Date(dateKey+"T12:00:00"),day=date.getDay(),avail=weeklyAvailability[String(day)];
 if(!avail){toast("برای این روز ساعت آزاد تعریف نشده است.");return}
 const duration=Number(entry.duration);if(!duration){toast("مدت‌زمان این بخش مشخص نیست.");return}
 const chosen=time?{start:plannerLocalDateTime(dateKey,time)}:plannerFindSlot(day,dateKey,duration,planId);if(!chosen){toast("در این روز برای این بخش زمان پیوسته کافی وجود ندارد.");return}
 const start=chosen.start,end=new Date(start.getTime()+duration*60000);
 const dayStart=plannerLocalDateTime(dateKey,avail.start),dayEnd=plannerLocalDateTime(dateKey,avail.end);
 if(start<dayStart||end>dayEnd){toast("این زمان خارج از ساعت آزاد روز است.");return}
 if(task.due_at&&end>new Date(task.due_at)){toast("این زمان بعد از مهلت تحویل قرار می‌گیرد.");return}
 const conflict=plannerDayOccupancy(day,dateKey,planId).some(p=>start<new Date(p.endDate.getTime()+(p.rest?0:plannerBreakMinutes)*60000)&&end>new Date(p.startDate.getTime()-(p.rest?0:plannerBreakMinutes)*60000));
 if(conflict){toast("این زمان با کار دیگری تداخل دارد یا فاصله استراحت را رعایت نمی‌کند.");return}
 const updated={...entry,date:dateKey,start:start.toISOString(),end:end.toISOString(),locked:true};
 weeklyPlan=weeklyPlan.map(p=>String(p.id||p.task_id)===String(planId)?updated:p);
 const {error}=await db.from("study_tasks").update({schedule_locked:true}).eq("id",task.id).eq("user_id",currentUser.id);
 if(error){toast(error.message);return}
 task.schedule_locked=true;
 try{await savePlannerData();renderWeeklyPlan();toast("زمان این بخش تغییر کرد و در برنامه ثابت شد.")}catch(err){toast("ذخیره برنامه انجام نشد: "+err.message)}
}
async function generateWeeklyPlan(persist=true){
 if(!currentUser)return;
 const taskMap=new Map(tasks.map(t=>[String(t.id),t]));
 const weekStartKey=plannerDateKey(plannerWeekStart()),weekEndKey=plannerDateKey(plannerDateAt(6));
 const lockedTaskIds=new Set(weeklyPlan.filter(p=>p.locked).map(p=>String(p.task_id)));
 const retained=weeklyPlan.filter(p=>{const t=taskMap.get(String(p.task_id));return t&&p.date>=weekStartKey&&p.date<=weekEndKey&&(t.status==="done"||lockedTaskIds.has(String(t.id)))});
 const retainedIds=new Set(retained.map(p=>String(p.task_id)));
 const scheduled=tasks.filter(t=>t.status==="pending"&&!retainedIds.has(String(t.id))).sort((a,b)=>{
  const ad=a.due_at?new Date(a.due_at).getTime():Infinity,bd=b.due_at?new Date(b.due_at).getTime():Infinity;
  const priority={high:0,normal:1,low:2};return ad-bd||(priority[a.priority]??1)-(priority[b.priority]??1);
 });
 weeklyPlan=retained.slice();
 for(const task of scheduled){
  const total=Number(task.estimated_minutes);if(!Number.isInteger(total)||total<5)continue;
  const full=plannerChooseSlot(task,weeklyPlan);
  if(full){weeklyPlan.push({id:makeUUID(),task_id:task.id,date:full.dateKey,start:full.slot.start.toISOString(),end:full.slot.end.toISOString(),duration:total,locked:false,segment_index:1,segment_total:1});continue}
  let remaining=total,part=0;const usedDays=new Set(),newEntries=[];
  while(remaining>=5){
   const slot=plannerChoosePartialSlot(task,weeklyPlan,remaining,usedDays);if(!slot)break;
   part++;const entry={id:makeUUID(),task_id:task.id,date:slot.dateKey,start:slot.slot.start.toISOString(),end:slot.slot.end.toISOString(),duration:slot.slot.duration,locked:false,segment_index:part,segment_total:0};
   weeklyPlan.push(entry);newEntries.push(entry);usedDays.add(slot.dateKey);remaining-=slot.slot.duration;
  }
  newEntries.forEach(p=>p.segment_total=newEntries.length);
 }
 weeklyPlan.sort((a,b)=>a.date.localeCompare(b.date)||new Date(a.start)-new Date(b.start));
 if(persist){try{await savePlannerData()}catch(err){toast("ذخیره برنامه انجام نشد: "+err.message)}}
 renderWeeklyPlan();
 const assigned=new Map();for(const p of weeklyPlan)assigned.set(String(p.task_id),(assigned.get(String(p.task_id))||0)+Number(p.duration||0));
 const missed=tasks.filter(t=>t.status==="pending"&&(!t.estimated_minutes||(assigned.get(String(t.id))||0)<Number(t.estimated_minutes)));
 if(missed.length)toast("برنامه ساخته شد؛ "+fa(missed.length)+" کار به دلیل نبود مدت‌زمان یا ظرفیت کافی کامل زمان‌بندی نشد.");
}
$("planner-save-hours").addEventListener("click",async()=>{const b=$("planner-save-hours");b.disabled=true;try{await saveWeeklyAvailability();await generateWeeklyPlan(true);toast("ساعت‌های آزاد ذخیره شد.")}catch(err){toast(err.message)}finally{b.disabled=false}});
$("smart-generate").addEventListener("click",async()=>{try{await saveWeeklyAvailability();await generateWeeklyPlan(true)}catch(err){toast(err.message)}});
$("smart-clear").addEventListener("click",async()=>{if(!confirm("فقط برنامه‌های خودکار پاک شوند؟ زمان‌های دستی و کارهای انجام‌شده حفظ می‌شوند."))return;weeklyPlan=weeklyPlan.filter(p=>p.locked||planTaskById(p.task_id)?.status==="done");try{await savePlannerData();renderWeeklyPlan()}catch(err){toast(err.message)}});
document.addEventListener("click",async e=>{
 const unlock=e.target.closest("[data-plan-unlock]");
 if(unlock){const planId=unlock.dataset.planUnlock,entry=weeklyPlan.find(p=>String(p.id||p.task_id)===String(planId)),task=entry&&planTaskById(entry.task_id);if(!task)return;const {error}=await db.from("study_tasks").update({schedule_locked:false}).eq("id",task.id).eq("user_id",currentUser.id);if(error){toast(error.message);return}task.schedule_locked=false;weeklyPlan=weeklyPlan.filter(p=>String(p.task_id)!==String(task.id));await generateWeeklyPlan(true);toast("این تکلیف دوباره به زمان‌بندی خودکار برگشت.");return}
 const durationSave=e.target.closest("[data-plan-duration-save]");
 if(durationSave){const id=durationSave.dataset.planDurationSave,value=Number(document.querySelector("[data-plan-duration='"+id+"']")?.value);if(!Number.isInteger(value)||value<5||value>1440){toast("مدت‌زمان باید بین ۵ تا ۱۴۴۰ دقیقه باشد.");return}const {error}=await db.from("study_tasks").update({estimated_minutes:value}).eq("id",id).eq("user_id",currentUser.id);if(error){toast(error.message);return}const t=planTaskById(id);if(t)t.estimated_minutes=value;await generateWeeklyPlan(true);return}
 const b=e.target.closest("[data-plan-save]");if(!b)return;const id=b.dataset.planSave,date=document.querySelector("[data-plan-day='"+id+"']")?.value,time=document.querySelector("[data-plan-time='"+id+"']")?.value;if(!date||!time)return;await movePlannerTask(id,date,time)
});

$("settings-form").addEventListener("submit",async e=>{e.preventDefault();const row={user_id:currentUser.id,sleep_hours:$("sleep-hours").value?Number($("sleep-hours").value):null,wake_time:$("wake-time").value||null,theme:$("appearance").value,accent_theme:$("accent-theme").value,appearance:$("appearance").value,season_theme:$("season-theme").value,humor_enabled:$("humor-enabled").checked};const {error}=await db.from("planner_settings").upsert(row,{onConflict:"user_id"});if(error){toast(error.message);return}settings=row;profile.display_name=$("display-name").value.trim()||"کاربر";const {error:pe}=await db.from("profiles").update({display_name:profile.display_name}).eq("id",currentUser.id);if(pe){toast(pe.message);return} $("user-name").textContent=profile.display_name;$("user-avatar").textContent="👤";applyTheme(row.accent_theme,row.appearance,row.season_theme);updateHumor();toast("تنظیمات ذخیره شد.")});
function applyTheme(accent="emerald",appearance="light",season="auto"){const m=new Date().getMonth()+1;const detected=m>=3&&m<=5?"spring":m>=6&&m<=8?"summer":m>=9&&m<=11?"autumn":"winter";document.body.dataset.theme=accent;document.body.dataset.appearance=appearance;document.body.dataset.season=season==="auto"?detected:season;document.body.classList.toggle("light",appearance==="light"||(appearance==="system"&&matchMedia("(prefers-color-scheme: light)").matches));document.documentElement.dataset.font="vazirmatn"}
const humorLines=["اگر تکلیف‌ها خودشان انجام می‌شدند، احتمالاً الان اینجا نبودیم!","یک قدم کوچک هم از صفر کیلومتر جلوتر است.","مغزت را روشن کن؛ حالت پرواز برای بعد از درس!","امروز با خودت رقابت کن، نه با کل دنیا.","استراحت کوتاه مجاز است؛ ناپدید شدن سه‌ساعته نه!","هر تیک، یک پیروزی کوچک است."];
function updateHumor(){const enabled=!!settings.humor_enabled;$("welcome-mood").textContent=enabled?humorLines[Math.floor(Math.random()*humorLines.length)]:"کارها را انجام بده و پیشرفتت را ثبت کن."}

async function loadAnnouncements(){const {data,error}=await db.from("announcements").select("id,title,body,created_at,created_by").eq("published",true).order("created_at",{ascending:false});if(error)throw error;window.__announcements=data||[]}
let announcementChannel=null;
function stopAnnouncementRealtime(){if(announcementChannel){db.removeChannel(announcementChannel);announcementChannel=null}}
function startAnnouncementRealtime(){
 stopAnnouncementRealtime();
 announcementChannel=db.channel("mmd-announcements").on("postgres_changes",{event:"INSERT",schema:"public",table:"announcements"},payload=>{
  const item=payload.new;if(!item?.published||item.created_by===currentUser?.id)return;
  if(!window.__announcements?.some(x=>x.id===item.id)){window.__announcements=[item,...(window.__announcements||[])];renderAnnouncements();notifyLiveEvent("اطلاعیه جدید در MMD",item.title||item.body||"یک اطلاعیه تازه منتشر شد.","mmd-live-announcement-"+item.id,"./?page=announcements").catch(()=>{});}
 }).subscribe();
}
const SCHOOL_CLASSES={"هفتم":["هدف","مسئولیت"],"هشتم":["تلاش","کوشش"],"نهم":["اراده","استقامت"],"معلم":[]};
function schoolProfileLabel(p){if(!p?.school_grade)return "";return p.school_grade==="معلم"?"معلم":p.school_grade+(p.school_class?" · کلاس "+p.school_class:"");}
function syncSchoolClassOptions(selected=""){const grade=$("profile-grade").value,classes=SCHOOL_CLASSES[grade]||[],select=$("profile-class"),wrap=$("profile-class-wrap");select.innerHTML="";if(grade==="معلم"){wrap.classList.add("hidden");select.required=false;select.disabled=true;return}wrap.classList.remove("hidden");select.required=!!grade;select.disabled=!grade;const first=document.createElement("option");first.value="";first.textContent=grade?"انتخاب کلاس":"ابتدا پایه را انتخاب کنید";select.append(first);classes.forEach(name=>{const o=document.createElement("option");o.value=name;o.textContent=name;select.append(o)});select.value=selected;}
function syncProfileForm(){if(profile?.avatar_path){const u=db.storage.from("profile-avatars").getPublicUrl(profile.avatar_path).data.publicUrl;$("profile-preview-avatar").innerHTML='<img src="'+u+'" alt="تصویر پروفایل">'}else $("profile-preview-avatar").textContent="👤";
 $("profile-name").value=profile?.display_name||"";
 $("profile-bio").value=profile?.bio||"";
 $("profile-color").value=profile?.profile_color||"violet";
 $("profile-grade").value=profile?.account_type==="teacher"?"معلم":(profile?.school_grade||"");$("profile-grade").disabled=profile?.account_type==="teacher";syncSchoolClassOptions(profile?.school_class||"");
 updateProfilePreview();
}
function updateProfilePreview(){
 const name=$("profile-name").value.trim()||"کاربر MMD",bio=$("profile-bio").value.trim()||"اینجا معرفی کوتاهی از خودت بنویس.",color=$("profile-color").value;
 $("profile-preview-name").textContent=name;$("profile-preview-bio").textContent=bio;if(!profile?.avatar_path)$("profile-preview-avatar").textContent="👤";
 $("profile-preview").dataset.color=color;
 const badge=schoolProfileLabel({school_grade:$("profile-grade").value,school_class:$("profile-class").value});$("profile-school-badge").textContent=badge||"پایه و کلاس را انتخاب کنید";
}
["profile-name","profile-bio","profile-color"].forEach(id=>$(id).addEventListener("input",updateProfilePreview));
$("profile-grade").addEventListener("change",()=>{syncSchoolClassOptions();updateProfilePreview()});$("profile-class").addEventListener("change",updateProfilePreview);
$("profile-form").addEventListener("submit",async e=>{
 e.preventDefault();const btn=e.submitter||e.target.querySelector('[type="submit"]');btn.disabled=true;message("profile-message","در حال ذخیره...");
 try{
  if(!profile)await loadProfile();
  if(!profile)throw new Error("اطلاعات حساب بارگذاری نشده است؛ یک‌بار خارج شوید و دوباره وارد شوید.");
  const display_name=$("profile-name").value.trim(),bio=$("profile-bio").value.trim(),profile_color=$("profile-color").value,school_grade=profile?.account_type==="teacher"?"معلم":$("profile-grade").value,school_class=school_grade==="معلم"?null:$("profile-class").value;
  if(!display_name)throw new Error("نام نمایشی را وارد کنید.");
  if(!school_grade||(school_grade!=="معلم"&&!school_class))throw new Error("پایه و نام کلاس را انتخاب کنید.");
  const payload={display_name,bio,profile_color,school_grade,school_class};
  const {data,error}=await db.from("profiles").update(payload).eq("id",currentUser.id).select("id,display_name,is_admin,is_approved,is_banned,account_type,avatar_path,avatar_emoji,chat_enabled,bio,profile_color,school_grade,school_class").single();
  if(error)throw error;if(!data)throw new Error("اطلاعات پروفایل ذخیره نشد.");
  profile={...profile,...data};$("profile-grade").disabled=profile?.account_type==="teacher";
  $("user-name").textContent=display_name;if(profile.avatar_path){const avatarUrl=db.storage.from("profile-avatars").getPublicUrl(profile.avatar_path).data.publicUrl;$("user-avatar").innerHTML='<img src="'+avatarUrl+'" alt="">'}else $("user-avatar").textContent="👤";$("school-grade-chip").textContent=schoolProfileLabel(profile);
  if(profile.avatar_path){const u=db.storage.from("profile-avatars").getPublicUrl(profile.avatar_path).data.publicUrl;$("user-avatar").innerHTML='<img src="'+u+'" alt="">'}
  updateProfilePreview();document.body.dataset.profileColor=profile_color;$("welcome-title").textContent="سلام "+display_name+", برنامه امروزت آماده است.";
  message("profile-message","پروفایل با موفقیت ذخیره شد.");
 }catch(err){console.error("Profile save failed",err);message("profile-message",err.message||"ذخیره پروفایل انجام نشد.",true)}
 finally{btn.disabled=false}
});
function renderAnnouncements(){const rows=window.__announcements||[];$("announcement-list").innerHTML=rows.length?rows.map(a=>'<article class="form-panel"><div class="section-head"><h3>'+escapeHtml(a.title)+'</h3><small class="muted">'+jalaliDate(a.created_at)+'</small></div><p style="white-space:pre-wrap;line-height:2">'+escapeHtml(a.body)+'</p>'+(profile?.is_admin?'<button class="icon-btn" data-delete-announcement="'+a.id+'">حذف اطلاعیه</button>':"")+'</article>').join(""):'<div class="empty">در حال حاضر اطلاعیه‌ای منتشر نشده است.</div>'}
$("announcement-admin-form").addEventListener("submit",async e=>{e.preventDefault();const row={title:$("announcement-title").value.trim(),body:$("announcement-body").value.trim(),created_by:currentUser.id,published:true};const {data:savedAnnouncement,error}=await db.from("announcements").insert(row).select("id").single();if(error){message("announcement-message",error.message,true);return}db.functions.invoke("push-notify",{body:{action:"notify_announcement",announcement_id:savedAnnouncement.id}}).then(({error})=>{if(error)console.warn("Announcement push skipped",error)});e.target.reset();await loadAnnouncements();renderAnnouncements();message("announcement-message","اطلاعیه منتشر شد و اعلان آن ارسال شد.")});
document.addEventListener("click",async e=>{
 const notice=e.target.closest("[data-delete-announcement]");if(notice){if(!confirm("این اطلاعیه حذف شود؟"))return;const {error}=await db.from("announcements").delete().eq("id",notice.dataset.deleteAnnouncement);if(error)toast(error.message);else{await loadAnnouncements();renderAnnouncements()}return}
 const renew=e.target.closest("[data-renew-user]");
 if(renew){
  const u=(window.__adminUsers||[]).find(x=>x.id===renew.dataset.renewUser);if(!u)return;
  const raw=prompt("اشتراک چند ماه تمدید شود؟","2");if(raw===null)return;
  const months=Number(raw.trim());
  if(!Number.isInteger(months)||months<1||months>24){toast("تعداد ماه باید عددی بین ۱ تا ۲۴ باشد.");return;}
  renew.disabled=true;
  try{
   const result=await callAdmin("renew_subscription",{user_id:u.id,months});
   toast("اشتراک "+(u.display_name||"کاربر")+" تا "+jalaliDate(result.ends_at)+" تمدید شد.");
   await loadAdminUsers();
  }catch(err){toast("تمدید انجام نشد: "+err.message);}
  finally{renew.disabled=false;}
  return;
 }
 const ban=e.target.closest("[data-ban-user]");if(ban){const u=(window.__adminUsers||[]).find(x=>x.id===ban.dataset.banUser);if(!u)return;const action=u.is_banned?"unban_user":"ban_user";if(!confirm(u.is_banned?"مسدودیت این کاربر برداشته شود؟":"این کاربر مسدود شود؟"))return;try{await callAdmin(action,{user_id:u.id});toast(u.is_banned?"مسدودیت برداشته شد.":"کاربر مسدود شد.");await loadAdminUsers()}catch(err){toast(err.message)}return}
 const remove=e.target.closest("[data-delete-user]");if(remove){const u=(window.__adminUsers||[]).find(x=>x.id===remove.dataset.deleteUser);if(!u)return;if(!confirm("حذف دائمی حساب «"+(u.display_name||u.login_id||"کاربر")+"» و تمام اطلاعات وابسته؟ این کار قابل بازگشت نیست."))return;try{await callAdmin("delete_user",{user_id:u.id});toast("حساب و اطلاعات وابسته حذف شد.");await loadAdminUsers()}catch(err){toast(err.message)}return}
 const edit=e.target.closest("[data-edit-user]");if(edit){const u=(window.__adminUsers||[]).find(x=>x.id===edit.dataset.editUser);if(!u)return;const identifier=prompt("شناسه ورود جدید:",u.login_id||"");if(identifier===null)return;const display_name=prompt("نام نمایشی:",u.display_name||"");if(display_name===null)return;const password=prompt("رمز جدید؛ برای حفظ رمز فعلی خالی بگذارید:","");if(password===null)return;try{await callAdmin("update_user",{user_id:u.id,identifier:identifier.trim(),display_name:display_name.trim(),password});toast("اطلاعات حساب به‌روزرسانی شد.");await loadAdminUsers()}catch(err){toast(err.message)}return}
});
$("admin-create-form").addEventListener("submit",async e=>{e.preventDefault();message("admin-message","در حال ساخت حساب...");try{if(!$("new-start").value||!$("new-end").value)throw new Error("تاریخ شروع و پایان را از تقویم شمسی انتخاب کنید.");const result=await callAdmin("create_user",{identifier:$("new-identifier").value.trim(),password:$("new-password").value,display_name:$("new-name").value.trim(),starts_at:(()=>{const d=new Date($("new-start").value+"T00:00:00");if(!Number.isFinite(d.getTime()))throw new Error("تاریخ شروع اشتراک را انتخاب کنید.");return d.toISOString()})(),ends_at:(()=>{const d=new Date($("new-end").value+"T23:59:59");if(!Number.isFinite(d.getTime()))throw new Error("تاریخ پایان اشتراک را انتخاب کنید.");return d.toISOString()})()});message("admin-message","حساب ساخته شد: "+result.identifier);e.target.reset();await loadAdminUsers()}catch(err){message("admin-message",err.message,true)}});
$("refresh-users").addEventListener("click",()=>loadAdminUsers().catch(e=>message("admin-message",e.message,true)));
async function loadPendingUsers(){if(!profile?.is_admin)return;const r=await callAdmin("list_users");const a=(r.users||[]).filter(u=>u.is_approved===false);$("pending-users").innerHTML=a.map(u=>'<article class="task-item"><b>'+escapeHtml(u.display_name||"بدون نام")+'</b><button class="primary" data-approve="'+u.id+'">تأیید</button></article>').join("")||"درخواستی وجود ندارد."}
$("pending-users").addEventListener("click",async e=>{const b=e.target.closest("[data-approve]");if(!b)return;try{await callAdmin("set_approval",{user_id:b.dataset.approve,approved:true});await loadPendingUsers();await loadAdminUsers()}catch(x){toast(x.message)}});
async function loadAdminHumor(){if(!profile?.is_admin)return;const r=await callAdmin("list_humor_posts");$("admin-humor-list").innerHTML=(r.posts||[]).filter(p=>p.status==="pending").map(p=>'<article class="form-panel"><h3>'+escapeHtml(p.title)+'</h3><p>'+escapeHtml(p.body)+'</p><button class="primary" data-publish="'+p.id+'">تأیید و انتشار</button><button class="danger" data-decline="'+p.id+'">رد</button></article>').join("")||"مطلبی برای بررسی نیست."}
$("admin-humor-list").addEventListener("click",async e=>{const b=e.target.closest("[data-publish],[data-decline]");if(!b)return;try{await callAdmin("review_humor_post",{post_id:b.dataset.publish||b.dataset.decline,status:b.dataset.publish?"approved":"rejected"});if(b.dataset.publish)db.functions.invoke("push-notify",{body:{action:"notify_community_post",post_id:b.dataset.publish}}).then(({error})=>{if(error)console.warn("Approved community push skipped",error)});await loadAdminHumor()}catch(x){toast(x.message)}});
async function loadHumorFeed(){
 if(!currentUser)return;
 if(!featureFlags.humor_enabled&&!profile?.is_admin){$("humor-feed").textContent="این بخش موقتاً غیرفعال است.";return}
 const q=await db.from("humor_posts").select("id,user_id,title,body,media_path,media_type,status,created_at").or("status.eq.approved,user_id.eq."+currentUser.id).order("created_at",{ascending:false});if(q.error)throw q.error;
 const ids=[...new Set((q.data||[]).map(p=>p.user_id))];
 const pr=ids.length?await db.from("public_profiles").select("id,display_name,bio,avatar_path").in("id",ids):{data:[],error:null};if(pr.error)throw pr.error;
 const likes=await db.from("humor_post_likes").select("post_id,user_id");if(likes.error)throw likes.error;
 const comments=await db.from("humor_post_comments").select("id,post_id,user_id,body,created_at").order("created_at");if(comments.error)throw comments.error;
 const commentIds=[...new Set((comments.data||[]).map(x=>x.user_id))];const cp=commentIds.length?await db.from("public_profiles").select("id,display_name").in("id",commentIds):{data:[],error:null};if(cp.error)throw cp.error;const commentPeople=new Map((cp.data||[]).map(p=>[p.id,p]));const people=new Map((pr.data||[]).map(p=>[p.id,p]));const feed=$("humor-feed");feed.innerHTML="";
 for(const p of q.data||[]){
  const u=people.get(p.user_id)||{};const card=document.createElement("article");card.className="post-card community-post";
  const author=document.createElement("button");author.className="post-author-link";author.type="button";
  const av=u.avatar_path?db.storage.from("profile-avatars").getPublicUrl(u.avatar_path).data.publicUrl:"";
  if(av){const img=document.createElement("img");img.src=av;img.alt="";author.append(img)}else{const span=document.createElement("span");span.className="post-avatar";span.textContent="👤";author.append(span)}
  const name=document.createElement("b");name.textContent=u.display_name||"کاربر";author.append(name);author.addEventListener("click",()=>openPublicProfile(p.user_id).catch(x=>toast(x.message)));card.append(author);
  const meta=document.createElement("small");meta.className="post-time";meta.textContent=new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium",timeStyle:"short"}).format(new Date(p.created_at))+(p.status==="pending"?" · در انتظار تأیید مدیر":"");card.append(meta);if(p.status==="pending"){const pending=document.createElement("p");pending.className="hint";pending.textContent="این مطلب فقط برای شما نمایش داده می‌شود و پس از تأیید مدیر برای همه منتشر خواهد شد.";card.append(pending)}const title=document.createElement("h3");title.textContent=p.title;card.append(title);
  const body=document.createElement("p");body.className="post-body";body.textContent=p.body||"";card.append(body);if(profile?.is_admin){const del=document.createElement("button");del.type="button";del.className="danger";del.textContent="حذف مطلب";del.addEventListener("click",async()=>{if(!confirm("این مطلب و فایل پیوست آن حذف شود؟"))return;if(p.media_path){const rm=await db.storage.from("humor-media").remove([p.media_path]);if(rm.error){toast(rm.error.message);return}}const r=await db.from("humor_posts").delete().eq("id",p.id);if(r.error){toast(r.error.message);return}toast("مطلب حذف شد.");await loadHumorFeed()});card.append(del)}
  if(p.media_path){const z=await db.storage.from("humor-media").createSignedUrl(p.media_path,3600);if(z.data?.signedUrl){if(p.media_type==="video"){const video=document.createElement("video");video.controls=true;video.playsInline=true;video.controlsList="nodownload";video.disablePictureInPicture=true;video.src=z.data.signedUrl;card.append(video);const dl=document.createElement("button");dl.className="secondary download-request";dl.textContent="⬇ درخواست دانلود";dl.addEventListener("click",async()=>{alert("برای درخواست مجوز دانلود، از بخش «ارتباط با ادمین» پیام بفرست.")});card.append(dl)}else{const img=document.createElement("img");img.src=z.data.signedUrl;img.alt="";img.style.maxWidth="100%";card.append(img)}}}
  const pl=(likes.data||[]).filter(x=>x.post_id===p.id),liked=pl.some(x=>x.user_id===currentUser.id);
  const like=document.createElement("button");like.className="secondary";like.textContent=(liked?"♥ ":"♡ ")+fa(pl.length)+" پسند";like.addEventListener("click",async()=>{const old=await db.from("humor_post_likes").select("id").eq("post_id",p.id).eq("user_id",currentUser.id).maybeSingle();if(old.error){toast(old.error.message);return}const res=old.data?await db.from("humor_post_likes").delete().eq("id",old.data.id):await db.from("humor_post_likes").insert({post_id:p.id,user_id:currentUser.id});if(res.error){toast(res.error.message);return}await loadHumorFeed()});card.append(like);
  const postComments=(comments.data||[]).filter(x=>x.post_id===p.id);
  if(postComments.length){const commentsBox=document.createElement("div");commentsBox.className="post-comments-list";for(const c of postComments){const item=document.createElement("div");item.className="post-comment";const who=commentPeople.get(c.user_id)||{};const nm=document.createElement("b");nm.textContent=who.display_name||"کاربر";const msg=document.createElement("span");msg.textContent=c.body;item.append(nm,msg);if(profile?.is_admin){const cd=document.createElement("button");cd.type="button";cd.className="danger";cd.textContent="حذف دیدگاه";cd.addEventListener("click",async()=>{if(!confirm("این دیدگاه حذف شود؟"))return;const rr=await db.from("humor_post_comments").delete().eq("id",c.id);if(rr.error){toast(rr.error.message);return}await loadHumorFeed()});item.append(cd)}commentsBox.append(item)}card.append(commentsBox)}
  const form=document.createElement("form");form.className="post-comment-form";const input=document.createElement("input");input.name="comment";input.maxLength=1000;input.placeholder="دیدگاه بنویس...";input.required=true;const send=document.createElement("button");send.className="primary";send.textContent="ارسال";form.append(input,send);form.addEventListener("submit",async ev=>{ev.preventDefault();const res=await db.from("humor_post_comments").insert({post_id:p.id,user_id:currentUser.id,body:input.value.trim()}).select("id").single();if(res.error){toast(res.error.message);return}db.functions.invoke("push-notify",{body:{action:"notify_community_comment",comment_id:res.data.id}}).then(({error})=>{if(error)console.warn("Community comment push skipped",error)});await loadHumorFeed()});card.append(form);feed.append(card);
 }
 if(!q.data?.length)feed.textContent="هنوز مطلبی منتشر نشده است.";
}
async function openPublicProfile(id){
 if(!id||id===currentUser?.id){navigate("profile");return}
 const q=await db.from("public_profiles").select("id,display_name,bio,avatar_path,school_grade,school_class,account_type,profile_color,chat_enabled").eq("id",id).maybeSingle();
 if(q.error)throw q.error;if(!q.data)return;
 const p=q.data;
 const posts=await db.from("humor_posts").select("id,title,body,media_path,media_type,created_at").eq("user_id",id).eq("status","approved").order("created_at",{ascending:false}).limit(8);
 if(posts.error)throw posts.error;
 const overlay=document.createElement("div");overlay.className="public-profile-modal";overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","پروفایل کاربر");
 const shell=document.createElement("div");shell.className="wa-profile";
 const top=document.createElement("div");top.className="wa-profile-top";
 const back=document.createElement("button");back.type="button";back.className="wa-profile-back";back.textContent="×";back.setAttribute("aria-label","بستن پروفایل");
 const topTitle=document.createElement("span");topTitle.textContent="اطلاعات کاربر";
 back.addEventListener("click",closePublicProfileModal);top.append(back,topTitle);shell.append(top);
 const hero=document.createElement("section");hero.className="wa-profile-hero";
 const avatarWrap=document.createElement("div");avatarWrap.className="wa-profile-avatar";
 if(p.avatar_path){const img=document.createElement("img");img.src=db.storage.from("profile-avatars").getPublicUrl(p.avatar_path).data.publicUrl+"?v="+Date.now();img.alt="تصویر پروفایل";avatarWrap.append(img)}else avatarWrap.textContent="👤";
 const name=document.createElement("h2");name.textContent=p.display_name||"کاربر";
 const type=document.createElement("p");type.className="wa-profile-type";type.textContent=p.account_type==="teacher"?"معلم":"دانش‌آموز";
 hero.append(avatarWrap,name,type);shell.append(hero);
 const actions=document.createElement("div");actions.className="wa-profile-actions";
 const chat=document.createElement("button");chat.type="button";chat.className="primary";chat.textContent=p.chat_enabled===false?"چت غیرفعال است":"✉ پیام دادن";chat.disabled=p.chat_enabled===false;
 chat.addEventListener("click",()=>{navigate("chat");startChatWithUser(id).catch(e=>toast(e.message))});
 actions.append(chat);shell.append(actions);
 const about=document.createElement("section");about.className="wa-profile-info-card";
 const aboutLabel=document.createElement("small");aboutLabel.textContent="درباره";
 const aboutText=document.createElement("p");aboutText.textContent=p.bio||"این کاربر هنوز توضیحی برای پروفایل خود ثبت نکرده است.";
 about.append(aboutLabel,aboutText);shell.append(about);
 const info=document.createElement("section");info.className="wa-profile-info-card";
 const infoTitle=document.createElement("small");infoTitle.textContent="اطلاعات";
 info.append(infoTitle);
 const addInfo=(label,value)=>{const row=document.createElement("div");row.className="wa-profile-info-row";const k=document.createElement("span");k.textContent=label;const val=document.createElement("b");val.textContent=value||"ثبت نشده";row.append(k,val);info.append(row)};
 addInfo("نوع حساب",p.account_type==="teacher"?"معلم":"دانش‌آموز");
 addInfo("پایه",p.account_type==="teacher"?"—":(p.school_grade||"ثبت نشده"));
 addInfo("کلاس",p.school_class||"ثبت نشده");
 shell.append(info);
 const postSection=document.createElement("section");postSection.className="wa-profile-posts";
 const postHead=document.createElement("h3");postHead.textContent="مطالب منتشرشده";postSection.append(postHead);
 if(!posts.data?.length){const empty=document.createElement("p");empty.className="wa-profile-empty";empty.textContent="هنوز مطلبی منتشر نکرده است.";postSection.append(empty)}
 for(const post of posts.data||[]){
  const card=document.createElement("article");card.className="wa-profile-post";
  const title=document.createElement("h4");title.textContent=post.title||"بدون عنوان";
  const body=document.createElement("p");body.textContent=post.body||"";
  card.append(title,body);
  if(post.media_path){const media=document.createElement("small");media.className="wa-profile-media-note";media.textContent=post.media_type?.startsWith("video/")?"🎬 ویدئو":"🖼 تصویر";card.append(media)}
  const date=document.createElement("small");date.textContent=new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium"}).format(new Date(post.created_at));card.append(date);postSection.append(card);
 }
 shell.append(postSection);overlay.append(shell);
 overlay.addEventListener("click",ev=>{if(ev.target===overlay)closePublicProfileModal()});
 document.body.append(overlay);
 const onKey=ev=>{if(ev.key==="Escape")closePublicProfileModal()};
 document.addEventListener("keydown",onKey);overlay._cleanup=()=>document.removeEventListener("keydown",onKey);
}
function closePublicProfileModal(){
 const modal=document.querySelector(".public-profile-modal");if(!modal)return;
 modal._cleanup?.();modal.remove();
}
function openAvatarCropper(file){
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{
   const modal=document.createElement("div");modal.className="avatar-crop-modal";modal.innerHTML='<div class="avatar-crop-panel" dir="rtl"><div class="avatar-crop-head"><button type="button" class="avatar-crop-close" aria-label="بستن">×</button><strong>تنظیم تصویر پروفایل</strong><span></span></div><p class="avatar-crop-hint">عکس را جابه‌جا یا بزرگ‌نمایی کن تا داخل قاب دایره‌ای قرار بگیرد.</p><div class="avatar-crop-stage"><img class="avatar-crop-image" alt="پیش‌نمایش برش تصویر"><div class="avatar-crop-ring"></div></div><label class="avatar-zoom-label">بزرگ‌نمایی <input class="avatar-crop-zoom" type="range" min="1" max="3" step=".01" value="1"></label><div class="avatar-crop-actions"><button type="button" class="avatar-crop-cancel">لغو</button><button type="button" class="primary avatar-crop-confirm">تأیید و ادامه</button></div></div>';
   const stage=modal.querySelector(".avatar-crop-stage"),preview=modal.querySelector(".avatar-crop-image"),zoomInput=modal.querySelector(".avatar-crop-zoom");
   const size=260,baseScale=Math.max(size/img.naturalWidth,size/img.naturalHeight),baseW=img.naturalWidth*baseScale,baseH=img.naturalHeight*baseScale;
   let zoom=1,dx=0,dy=0,drag=false,lastX=0,lastY=0,settled=false;
   preview.src=url;
   const bounds=()=>({minX:size-baseW*zoom,maxX:0,minY:size-baseH*zoom,maxY:0});
   const clamp=()=>{const b=bounds();dx=Math.min(b.maxX,Math.max(b.minX,dx));dy=Math.min(b.maxY,Math.max(b.minY,dy))};
   const paint=()=>{
    preview.style.width=(baseW*zoom)+"px";preview.style.height=(baseH*zoom)+"px";
    preview.style.left=((size-baseW*zoom)/2+dx)+"px";preview.style.top=((size-baseH*zoom)/2+dy)+"px";
    preview.style.transform="none";
   };
   const finish=value=>{if(settled)return;settled=true;URL.revokeObjectURL(url);modal.remove();resolve(value)};
   const close=()=>finish(null);
   modal.querySelector(".avatar-crop-close").onclick=close;modal.querySelector(".avatar-crop-cancel").onclick=close;
   zoomInput.oninput=()=>{zoom=Number(zoomInput.value);clamp();paint()};
   stage.addEventListener("pointerdown",e=>{drag=true;lastX=e.clientX;lastY=e.clientY;stage.setPointerCapture(e.pointerId)});
   stage.addEventListener("pointermove",e=>{if(!drag)return;dx+=e.clientX-lastX;dy+=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;clamp();paint()});
   stage.addEventListener("pointerup",()=>drag=false);stage.addEventListener("pointercancel",()=>drag=false);
   modal.querySelector(".avatar-crop-confirm").onclick=()=>{
    const scale=baseScale*zoom;
    const left=(size-baseW*zoom)/2+dx,top=(size-baseH*zoom)/2+dy;
    const sx=Math.max(0,Math.min(img.naturalWidth-size/scale,-left/scale));
    const sy=Math.max(0,Math.min(img.naturalHeight-size/scale,-top/scale));
    const sw=size/scale,sh=size/scale;
    const canvas=document.createElement("canvas");canvas.width=512;canvas.height=512;
    const ctx=canvas.getContext("2d");ctx.drawImage(img,sx,sy,sw,sh,0,0,512,512);
    canvas.toBlob(blob=>{if(!blob){finish(null);return}finish(new File([blob],"profile.jpg",{type:"image/jpeg",lastModified:Date.now()}))},"image/jpeg",.92);
   };
   document.body.append(modal);paint();
  };
  img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("باز کردن تصویر انتخاب‌شده ممکن نیست."))};img.src=url;
 });
}
$("profile-photo").addEventListener("change",async e=>{
 const file=e.target.files?.[0];if(!file)return;const input=e.target;input.disabled=true;
 try{
  if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw new Error("فقط تصویر JPG، PNG یا WebP انتخاب کنید.");
  const cropped=await openAvatarCropper(file);if(!cropped)return;
  message("profile-message","در حال ذخیره تصویر...");
  if(!currentUser?.id)throw new Error("نشست کاربری معتبر نیست؛ دوباره وارد شوید.");
  const path=currentUser.id+"/"+makeUUID()+".jpg";
  const up=await db.storage.from("profile-avatars").upload(path,cropped,{contentType:"image/jpeg",cacheControl:"3600",upsert:false});
  if(up.error)throw new Error("خطای فضای ذخیره‌سازی: "+up.error.message);
  const saved=await db.from("profiles").update({avatar_path:path}).eq("id",currentUser.id).select("id,avatar_path").maybeSingle();
  if(saved.error){await db.storage.from("profile-avatars").remove([path]);throw new Error("فایل بارگذاری شد، اما ثبت پروفایل ناموفق بود: "+saved.error.message)}
  if(!saved.data)throw new Error("پروفایل به‌روزرسانی نشد؛ دوباره وارد حساب شوید.");
  const oldPath=profile.avatar_path;profile.avatar_path=path;
  const url=db.storage.from("profile-avatars").getPublicUrl(path).data.publicUrl+"?v="+Date.now();
  $("profile-preview-avatar").innerHTML='<img src="'+url+'" alt="تصویر پروفایل">';$("user-avatar").innerHTML='<img src="'+url+'" alt="">';
  if(oldPath)db.storage.from("profile-avatars").remove([oldPath]).then(({error})=>{if(error)console.warn("Old avatar cleanup failed",error)});
  message("profile-message","تصویر پروفایل ذخیره شد.");
 }catch(err){console.error("Avatar upload failed",err);message("profile-message","بارگذاری تصویر ناموفق بود: "+(err.message||"خطای نامشخص"),true)}
 finally{input.value="";input.disabled=false}
});
$("remove-profile-photo").addEventListener("click",async()=>{if(!profile?.avatar_path){toast("تصویر جداگانه‌ای برای حذف وجود ندارد.");return}const btn=$("remove-profile-photo");btn.disabled=true;message("profile-message","در حال حذف تصویر...");try{const oldPath=profile.avatar_path;const {data,error}=await db.from("profiles").update({avatar_path:null}).eq("id",currentUser.id).select("id").maybeSingle();if(error)throw error;if(!data)throw new Error("حذف تصویر از پروفایل انجام نشد.");profile.avatar_path=null;$("profile-preview-avatar").textContent="👤";$("user-avatar").textContent="👤";const rm=await db.storage.from("profile-avatars").remove([oldPath]);if(rm.error)console.warn("Avatar file cleanup failed",rm.error);message("profile-message","تصویر پروفایل حذف شد.")}catch(err){console.error("Avatar removal failed",err);message("profile-message","حذف تصویر ناموفق بود: "+err.message,true)}finally{btn.disabled=false}});

async function ensureTusLibrary(){
 if(window.tus?.Upload)return;
 await new Promise((resolve,reject)=>{
  const s=document.createElement("script");
  s.src="https://cdn.jsdelivr.net/npm/tus-js-client@4.3.1/dist/tus.min.js";
  s.onload=()=>window.tus?.Upload?resolve():reject(new Error("کتابخانه بارگذاری ویدئو آماده نشد."));
  s.onerror=()=>reject(new Error("دریافت ابزار بارگذاری ویدئو ناموفق بود."));
  document.head.appendChild(s);
 });
}
function showHumorUploadProgress(sent,total){
 const p=document.getElementById("humor-upload-progress"),bar=document.getElementById("humor-upload-bar"),label=document.getElementById("humor-upload-percent");
 if(!p||!bar||!label)return;
 const percent=total?Math.min(100,Math.floor(sent/total*100)):0;
 p.classList.remove("hidden");bar.style.width=percent+"%";label.textContent=percent+"٪ ("+(sent/1048576).toFixed(1)+" از "+(total/1048576).toFixed(1)+" مگابایت)";
}
function resetHumorUploadProgress(){const p=document.getElementById("humor-upload-progress"),bar=document.getElementById("humor-upload-bar"),label=document.getElementById("humor-upload-percent");if(p)p.classList.add("hidden");if(bar)bar.style.width="0%";if(label)label.textContent="0٪";}
async function uploadHumorVideoDirect(file,path){
 const {data:{session}}=await db.auth.getSession();
 if(!session?.access_token)throw new Error("نشست ورود معتبر نیست؛ دوباره وارد شو.");
 await new Promise((resolve,reject)=>{
  const xhr=new XMLHttpRequest();
  const objectPath=path.split("/").map(encodeURIComponent).join("/");
  xhr.open("POST",SUPABASE_URL+"/storage/v1/object/humor-media/"+objectPath);
  xhr.setRequestHeader("Authorization","Bearer "+session.access_token);
  xhr.setRequestHeader("apikey",SUPABASE_KEY);
  xhr.setRequestHeader("Content-Type",file.type||"video/mp4");
  xhr.setRequestHeader("x-upsert","false");
  xhr.upload.onprogress=e=>{if(e.lengthComputable)showHumorUploadProgress(e.loaded,e.total);};
  xhr.onload=()=>{if(xhr.status>=200&&xhr.status<300)resolve();else{let msg=xhr.responseText;try{msg=JSON.parse(msg).message||msg}catch{}reject(new Error("بارگذاری ویدئو ناموفق بود: "+msg))}};
  xhr.onerror=()=>reject(new Error("اتصال هنگام ارسال ویدئو قطع شد."));
  xhr.ontimeout=()=>reject(new Error("ارسال ویدئو بیش از حد طول کشید؛ دوباره تلاش کن."));
  xhr.timeout=180000;xhr.send(file);
 });
}
async function uploadHumorVideoResumable(file,path){
 await ensureTusLibrary();
 const {data:{session}}=await db.auth.getSession();
 if(!session?.access_token)throw new Error("نشست ورود معتبر نیست؛ دوباره وارد شو.");
 return new Promise((resolve,reject)=>{
  const upload=new window.tus.Upload(file,{
   endpoint:"https://tbmxbtbayqgfvdlmeuaz.storage.supabase.co/storage/v1/upload/resumable",
   retryDelays:[0,2000,5000,10000,20000],
   headers:{authorization:"Bearer "+session.access_token,apikey:SUPABASE_KEY},
   uploadDataDuringCreation:true,removeFingerprintOnSuccess:true,
   chunkSize:6*1024*1024,
   metadata:{bucketName:"humor-media",objectName:path,contentType:file.type||"video/mp4",cacheControl:"3600"},
   onError:error=>reject(new Error("بارگذاری ویدئو متوقف شد: "+(error.message||error))),
   onProgress:(sent,total)=>{showHumorUploadProgress(sent,total);},
   onSuccess:()=>resolve()
  });
  upload.findPreviousUploads().then(previous=>{
   if(previous.length)upload.resumeFromPreviousUpload(previous[0]);
   upload.start();
  }).catch(reject);
 });
}
$("humor-submit-form").addEventListener("submit",async e=>{e.preventDefault();const b=e.submitter||$("humor-submit-form").querySelector('button[type="submit"]');if(b)b.disabled=true;try{let path=null,type="text";const f=$("humor-file").files[0];if(f){message("humor-submit-message","در حال آماده‌سازی فایل...");if(f.size>52428800)throw new Error("حداکثر حجم فایل ۵۰ مگابایت است.");const compressed=f.type.startsWith("video/")?f:await compressUploadFile(f);if(compressed.size>52428800)throw new Error("حجم فایل بیشتر از ۵۰ مگابایت است.");type=f.type.startsWith("video/")?"video":"image";path=currentUser.id+"/"+makeUUID()+"-"+compressed.name.replace(/[^a-zA-Z0-9._-]/g,"_");message("humor-submit-message","در حال بارگذاری فایل...");if(type==="video"){resetHumorUploadProgress();if(compressed.size<=6*1024*1024){await uploadHumorVideoDirect(compressed,path)}else{await uploadHumorVideoResumable(compressed,path)}}else{const {error}=await db.storage.from("humor-media").upload(path,compressed,{contentType:compressed.type,upsert:false});if(error)throw new Error("بارگذاری فایل ناموفق بود: "+error.message)}}message("humor-submit-message","فایل بارگذاری شد؛ در حال ثبت مطلب برای بررسی...");const postStatus=featureFlags.humor_requires_approval?"pending":"approved";const {data:savedPost,error}=await db.from("humor_posts").insert({user_id:currentUser.id,title:$("humor-title").value.trim(),body:$("humor-body").value.trim(),media_path:path,media_type:type,status:postStatus}).select("id").single();if(error){if(path)await db.storage.from("humor-media").remove([path]);throw new Error("ثبت مطلب ناموفق بود: "+error.message)}if(postStatus==="approved")db.functions.invoke("push-notify",{body:{action:"notify_community_post",post_id:savedPost.id}}).then(({error})=>{if(error)console.warn("Community push skipped",error)});e.target.reset();message("humor-submit-message",featureFlags.humor_requires_approval?"مطلب ارسال شد و در انتظار بررسی مدیر است.":"مطلب منتشر شد؛ اعلان برای کاربران فعال ارسال می‌شود.");resetHumorUploadProgress();await loadHumorFeed()}catch(x){message("humor-submit-message",x.message||"ارسال ناموفق بود.",true)}finally{if(b)b.disabled=false}});
async function loadAdminUsers(){if(!profile?.is_admin)return;const result=await callAdmin("list_users");window.__adminUsers=result.users||[];$("admin-users").innerHTML=window.__adminUsers.length?window.__adminUsers.map(u=>'<article class="task-item"><div class="task-main"><h3>'+escapeHtml(u.display_name||"بدون نام")+'</h3><p>شناسه: '+escapeHtml(u.login_id||u.phone||u.email||"—")+' · '+(u.ends_at?"پایان اشتراک: "+jalaliDate(u.ends_at):"بدون اشتراک")+'</p><p>'+escapeHtml(u.email||"")+'</p></div><span class="priority">'+(u.is_banned?"مسدود":u.is_active?"فعال":"غیرفعال")+'</span>'+(u.is_admin?"":'<label class="switch-row"><input type="checkbox" data-chat-toggle="'+u.id+'" '+(u.chat_enabled!==false?"checked":"")+'> اجازه چت</label><div class="task-actions"><button class="secondary" data-renew-user="'+u.id+'">تمدید اشتراک</button><button class="secondary" data-edit-user="'+u.id+'">ویرایش حساب</button><button class="secondary" data-ban-user="'+u.id+'">'+(u.is_banned?"رفع بن":"بن کاربر")+'</button><button class="danger" data-delete-user="'+u.id+'">حذف کاربر</button></div>')+'</article>').join(""):'<div class="empty">کاربری ثبت نشده است.</div>'}
document.addEventListener("change",async e=>{const t=e.target.closest("[data-chat-toggle]");if(!t)return;try{await callAdmin("set_chat_enabled",{user_id:t.dataset.chatToggle,enabled:t.checked});toast("دسترسی چت به‌روزرسانی شد.")}catch(x){t.checked=!t.checked;toast(x.message)}});
async function loadExcelLibrary(){
 if(window.XLSX)return true;
 const sources=["https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js","https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js","https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"];
 for(const src of sources){
  const loaded=await new Promise(resolve=>{
   const script=document.createElement("script");script.src=src;script.async=true;
   script.onload=()=>resolve(!!window.XLSX);script.onerror=()=>resolve(false);
   document.head.appendChild(script);
  });
  if(loaded)return true;
 }
 return false;
}
function csvCell(value){
 let s=String(value??"");
 if(/^[=+@\\-]/.test(s))s="'"+s;
 return '"'+s.replace(/"/g,'""')+'"';
}
function downloadExportFile(file){
  const blob=file instanceof Blob?file:new Blob([file?.content??""],{type:file?.type||"text/csv;charset=utf-8"});
  const filename=file?.name||"MMD-Study-Planner.csv";
  if(!blob.size)throw new Error("فایل خروجی خالی است.");
  if(window.__mmdExportUrl)URL.revokeObjectURL(window.__mmdExportUrl);
  const url=URL.createObjectURL(blob);window.__mmdExportUrl=url;
  let link=document.getElementById("mmd-export-download");
  if(!link){link=document.createElement("a");link.id="mmd-export-download";document.body.appendChild(link)}
  link.href=url;
  link.download=filename;
  link.textContent="⬇ برای دانلود و ذخیره فایل اینجا بزن";
  link.setAttribute("role","button");
  link.setAttribute("aria-label","دانلود فایل خروجی "+filename);
  link.setAttribute("target","_self");
  link.style.cssText="display:block;position:fixed;z-index:2147483647;bottom:calc(18px + env(safe-area-inset-bottom, 0px));left:12px;right:12px;width:auto;box-sizing:border-box;padding:16px 18px;background:#a4f05b;color:#17220e;border-radius:14px;font-weight:900;font-size:16px;text-align:center;text-decoration:none;box-shadow:0 8px 25px #0008;visibility:visible;opacity:1;pointer-events:auto";
  link.onclick=()=>{link.textContent="در حال ذخیره فایل…";const usedUrl=url;setTimeout(()=>{if(window.__mmdExportUrl===usedUrl){URL.revokeObjectURL(usedUrl);window.__mmdExportUrl=null;link.remove()}},600000)};
  link.scrollIntoView?.({block:"nearest"});
  toast("فایل آماده است. نوار سبز پایین صفحه را لمس کن تا دانلود شود.");
}
$("export-users").addEventListener("click",async()=>{
 const btn=$("export-users");btn.disabled=true;
 try{
  message("admin-message","در حال دریافت اطلاعات کامل...");
  const result=await callAdmin("export_data");
  if(!result||!result.data||typeof result.data!=="object")throw new Error("پاسخ سرور فاقد داده است.");
  const labels={profiles:"کاربران",subscriptions:"اشتراک‌ها",study_tasks:"وظایف",routines:"برنامه ثابت",planner_settings:"تنظیمات",announcements:"اطلاعیه‌ها",auth_accounts:"حساب‌های ورود",humor_posts:"همتانه"};
  const counts=[];
  for(const [key,raw] of Object.entries(result.data)){
   const rows=Array.isArray(raw)?raw:[],headers=[...new Set([...(result.columns?.[key]||[]),...rows.flatMap(row=>Object.keys(row||{}))])];
   if(headers.length)counts.push({بخش:labels[key]||key,"تعداد رکورد":rows.length});
  }
  if(!counts.length)throw new Error("هیچ داده‌ای از سرور دریافت نشد.");
  const totalExportRows=Object.values(result.data).reduce((sum,value)=>sum+(Array.isArray(value)?value.length:0),0);
  if(!totalExportRows)throw new Error("سرور هیچ ردیفی برای خروجی برنگرداند؛ فایل خالی ساخته نشد.");
  const xlsxReady=await loadExcelLibrary();
  const stamp=jalaliDate(new Date()).replaceAll("/","-");
  if(xlsxReady){
   const wb=XLSX.utils.book_new();
   for(const [key,raw] of Object.entries(result.data)){
    const rows=Array.isArray(raw)?raw:[],headers=[...new Set([...(result.columns?.[key]||[]),...rows.flatMap(row=>Object.keys(row||{}))])];
    if(!headers.length)continue;
    const sheet=XLSX.utils.json_to_sheet(rows,{header:headers,skipHeader:false});
    XLSX.utils.book_append_sheet(wb,sheet,(labels[key]||key).slice(0,31));
   }
   XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(counts),"خلاصه خروجی");
   const bytes=XLSX.write(wb,{bookType:"xlsx",type:"array",compression:true});
   downloadExportFile(new File([bytes],"MMD-Study-Planner-"+stamp+".xlsx",{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));
   message("admin-message","فایل Excel آماده شد؛ "+totalExportRows+" ردیف اطلاعات در "+counts.length+" بخش.");
  }else{
   const sections=[];
   for(const [key,raw] of Object.entries(result.data)){
    const rows=Array.isArray(raw)?raw:[],headers=[...new Set([...(result.columns?.[key]||[]),...rows.flatMap(row=>Object.keys(row||{}))])];
    if(!headers.length)continue;
    sections.push((labels[key]||key)+"\\n"+headers.map(csvCell).join(",")+"\\n"+rows.map(row=>headers.map(h=>csvCell(row?.[h])).join(",")).join("\\n"));
   }
   sections.push("خلاصه خروجی\\nبخش,تعداد رکورد\\n"+counts.map(x=>csvCell(x.بخش)+","+x["تعداد رکورد"]).join("\\n"));
   downloadExportFile({content:"\\uFEFF"+sections.join("\\n\\n"),name:"MMD-Study-Planner-"+stamp+".csv",type:"text/csv;charset=utf-8"});
   message("admin-message","کتابخانه Excel بارگذاری نشد؛ فایل CSV استاندارد و قابل بازشدن در Excel آماده شد.");
  }
 }catch(err){console.error("Excel export failed",err);message("admin-message","خطا در خروجی: "+(err.message||"خطای نامشخص"),true)}
 finally{btn.disabled=false}
});
let activityReportData=null;
const weekdayNames=["یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه","شنبه"];
const taskStatusLabel={pending:"در انتظار انجام",done:"انجام‌شده",cancelled:"لغوشده"};
async function loadActivityReport(){
 if(!profile?.is_admin)throw new Error("این بخش فقط برای مدیر سامانه است.");
 const msg=$("activity-report-message"),loadBtn=$("load-activity-report"),exportBtn=$("export-activity-report");
 loadBtn.disabled=true;exportBtn.disabled=true;msg.textContent="در حال دریافت اطلاعات کاربران...";
 try{
  const result=await callAdmin("export_data");
  const d=result.data||{};
  const users=d.profiles||[],tasks=d.study_tasks||[],routines=d.routines||[];
  const names=new Map(users.map(u=>[u.id,u.display_name||u.login_id||"کاربر بدون نام"]));
  activityReportData={
   tasks:tasks.map(t=>({...t,user_name:names.get(t.user_id)||"کاربر حذف‌شده"})),
   routines:routines.map(r=>({...r,user_name:names.get(r.user_id)||"کاربر حذف‌شده"}))
  };
  const done=tasks.filter(t=>t.status==="done").length;
  const pending=tasks.filter(t=>t.status==="pending").length;
  const cancelled=tasks.filter(t=>t.status==="cancelled").length;
  $("activity-report-summary").innerHTML=[
   ["تعداد کاربران",users.length],["برنامه‌ها و تکالیف",tasks.length],["انجام‌شده",done],["در انتظار",pending],["برنامه‌های ثابت",routines.length]
  ].map(([label,value])=>'<article class="stat-card"><span>'+label+'</span><strong>'+fa(value)+'</strong></article>').join("");
  const grouped=new Map();
  for(const t of activityReportData.tasks){if(!grouped.has(t.user_id))grouped.set(t.user_id,{name:t.user_name,tasks:[],routines:[]});grouped.get(t.user_id).tasks.push(t)}
  for(const r of activityReportData.routines){if(!grouped.has(r.user_id))grouped.set(r.user_id,{name:r.user_name,tasks:[],routines:[]});grouped.get(r.user_id).routines.push(r)}
  const cards=[...grouped.values()].sort((a,b)=>a.name.localeCompare(b.name,"fa"));
  $("activity-report-list").innerHTML=cards.length?cards.map(u=>{
   const taskHtml=u.tasks.length?u.tasks.map(t=>'<article class="task-item"><div class="task-main"><h4>'+escapeHtml(t.title)+'</h4><p>'+escapeHtml(t.description||"بدون توضیحات")+' · مهلت: '+(t.due_at?jalaliDate(t.due_at,true):"تعیین نشده")+'</p></div><span class="priority">'+(taskStatusLabel[t.status]||escapeHtml(t.status||"نامشخص"))+'</span></article>').join(""):'<p class="hint">تکلیفی ثبت نکرده است.</p>';
   const routineHtml=u.routines.length?u.routines.map(r=>'<article class="task-item"><div class="task-main"><h4>'+escapeHtml(r.title)+'</h4><p>'+escapeHtml(r.details||"بدون توضیحات")+' · '+(weekdayNames[Number(r.weekday)]||"روز نامشخص")+' · '+(r.scheduled_time?String(r.scheduled_time).slice(0,5):"بدون ساعت")+'</p></div><span class="priority">'+(r.active===false?"غیرفعال":"فعال")+'</span></article>').join(""):'<p class="hint">برنامه ثابت هفتگی ثبت نکرده است.</p>';
   return '<section class="form-panel"><div class="section-head"><h3>'+escapeHtml(u.name)+'</h3><span class="muted">'+fa(u.tasks.length)+' تکلیف · '+fa(u.routines.length)+' برنامه ثابت</span></div><h4>برنامه‌ها و تکالیف</h4>'+taskHtml+'<h4 style="margin-top:16px">برنامه ثابت هفتگی</h4>'+routineHtml+'</section>';
  }).join(""):'<div class="empty">هنوز فعالیتی ثبت نشده است.</div>';
  exportBtn.disabled=false;
  msg.textContent="گزارش به‌روزرسانی شد. اطلاعات شامل برنامه‌های ثبت‌شده و وضعیت فعلی آن‌هاست.";
 }catch(err){msg.textContent="خطا در دریافت گزارش: "+err.message;throw err}
 finally{loadBtn.disabled=false}
}
$("load-activity-report").addEventListener("click",()=>loadActivityReport().catch(e=>console.error(e)));
$("export-activity-report").addEventListener("click",async()=>{
 const btn=$("export-activity-report");if(!activityReportData)return;btn.disabled=true;
 try{
  const taskRows=activityReportData.tasks.map(t=>({"نام کاربر":t.user_name,"عنوان برنامه":t.title,"توضیحات":t.description||"","وضعیت":taskStatusLabel[t.status]||t.status,"اولویت":t.priority,"مهلت":t.due_at||"","تاریخ ثبت":t.created_at||""}));
  const routineRows=activityReportData.routines.map(r=>({"نام کاربر":r.user_name,"عنوان برنامه ثابت":r.title,"توضیحات":r.details||"","روز هفته":weekdayNames[Number(r.weekday)]||"","ساعت":r.scheduled_time||"","وضعیت":r.active===false?"غیرفعال":"فعال","تاریخ ثبت":r.created_at||""}));
  if(window.XLSX){
   const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(taskRows),"تکالیف و برنامه‌ها");XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(routineRows),"برنامه ثابت");
   const bytes=XLSX.write(wb,{bookType:"xlsx",type:"array",compression:true});downloadExportFile(new File([bytes],"MMD-User-Activity-"+jalaliDate(new Date()).replaceAll("/","-")+".xlsx",{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));
   $("activity-report-message").textContent="فایل Excel فعالیت کاربران آماده شد.";
  }else{
   const all=[["بخش","نام کاربر","عنوان","توضیحات","وضعیت","جزئیات"],...taskRows.map(x=>["تکالیف",x["نام کاربر"],x["عنوان برنامه"],x["توضیحات"],x["وضعیت"],x["مهلت"]]),...routineRows.map(x=>["برنامه ثابت",x["نام کاربر"],x["عنوان برنامه ثابت"],x["توضیحات"],x["وضعیت"],x["روز هفته"]+" "+x["ساعت"]])];
   const csv="\\uFEFF"+all.map(row=>row.map(csvCell).join(",")).join("\n");
   downloadExportFile({content:csv,name:"MMD-User-Activity-"+jalaliDate(new Date()).replaceAll("/","-")+".csv",type:"text/csv;charset=utf-8"});
   $("activity-report-message").textContent="فایل CSV سازگار با Excel آماده شد.";
  }
 }catch(err){$("activity-report-message").textContent="خطا در ساخت فایل: "+err.message}
 finally{btn.disabled=false}
});


async function checkMmdRelease(showNotice=true){
 try{
  const response=await fetch("./version.json?ts="+Date.now(),{cache:"no-store"});if(!response.ok)return;
  const info=await response.json(),version=String(info.version||"");if(!version)return;
  const seen=localStorage.getItem("mmd_seen_release");
  if(seen&&seen!==version&&showNotice){
   const text="نسخه "+version+" منتشر شد. "+(info.release_notes||"برای دریافت نسخه تازه، برنامه را به‌روزرسانی کنید.");
   if(typeof toast==="function")toast(text);
   if("Notification" in window&&Notification.permission==="granted")new Notification("به‌روزرسانی MMD",{body:text,icon:"./assets/icon.svg"});
  }
  localStorage.setItem("mmd_seen_release",version);
  if("serviceWorker" in navigator){const reg=await navigator.serviceWorker.getRegistration();if(reg)await reg.update().catch(()=>{});}
 }catch(error){console.warn("MMD release check failed",error)}
}

checkMmdRelease().catch(()=>{});setInterval(()=>checkMmdRelease(),180000);
boot().catch(err=>{console.error(err);show("app-view",false);show("auth-view",true);message("auth-message","خطا در راه‌اندازی: "+err.message,true)});
// In the messenger, Enter inserts a new line; sending is only done with the send button.
$("chat-input").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();const t=e.currentTarget,start=t.selectionStart,end=t.selectionEnd;t.setRangeText("\n",start,end,"end");t.dispatchEvent(new Event("input",{bubbles:true}))}});

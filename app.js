/* MMD Study Planner - client application */
const SUPABASE_URL = "https://tbmxbtbayqgfvdlmeuaz.supabase.co";
const SUPABASE_KEY = "sb_publishable_n89FjocOtomNmAReFaP-vg_PMFbVow3";
const ADMIN_FUNCTION = SUPABASE_URL + "/functions/v1/admin-manage";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = (id) => document.getElementById(id);
if(window.jalaliDatepicker){window.jalaliDatepicker.startWatch({persianDigits:true,targetValueInput:"attr",targetValueType:"attr",zIndex:9999});}
const fa = (n) => new Intl.NumberFormat("fa-IR").format(n);
const weekdays = ["یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه","شنبه"];
let currentUser = null, profile = null, tasks = [], routines = [], settings = {}, taskFilter = "all";
let featureFlags={chat_enabled:true,humor_enabled:true};
const smartKey=()=> "mmd_smart_planner_"+(currentUser?.id||"guest");
function smartEnabled(){return !!currentUser && localStorage.getItem(smartKey())==="on";}
function syncSmartPlanner(){const enabled=smartEnabled();if($("smart-planner-toggle"))$("smart-planner-toggle").checked=enabled;show("smart-planner-nav",enabled);}
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
 try{localStorage.setItem("mmd_terms_accepted","mmd-terms-2026-11-v3");await continueAfterPolicy()}
 catch(err){console.error(err);message("terms-message","ذخیره تأیید قوانین ممکن نشد. تنظیمات مرورگر را بررسی کنید.",true)}
});
async function boot(){
 if("serviceWorker" in navigator){navigator.serviceWorker.register("./service-worker.js").catch(err=>console.warn("Service worker unavailable",err));}
 if(localStorage.getItem("mmd_terms_accepted")!=="mmd-terms-2026-11-v3"){show("terms-view",true);show("auth-view",false);show("app-view",false);return}
 db.auth.onAuthStateChange((event)=>{if(event==="SIGNED_OUT"){currentUser=null;profile=null;show("app-view",false);show("expired-subscription-view",false);show("banned-account-view",false);show("auth-view",true)}});
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
if($("expired-logout-btn"))$("expired-logout-btn").addEventListener("click",async()=>{if(confirm("مطمئنی می‌خواهی از حساب خارج شوی؟"))await db.auth.signOut()});
if($("banned-logout-btn"))$("banned-logout-btn").addEventListener("click",async()=>{if(confirm("مطمئنی می‌خواهی از حساب خارج شوی؟"))await db.auth.signOut()});
$("show-signup").addEventListener("click",()=>{show("login-card",false);show("signup-card",true)});
$("show-login").addEventListener("click",()=>{show("signup-card",false);show("login-card",true)});
$("signup-form").addEventListener("submit",async e=>{
 e.preventDefault();
 const username=$("signup-username").value.trim().toLowerCase();
 const displayName=$("signup-name").value.trim();
 const password=$("signup-password").value;
 const accountType=$("signup-account-type").value==="teacher"?"teacher":"student";
 if(!/^[\p{L}\p{N}_.-]{3,30}$/u.test(username)){message("signup-message","نام کاربری باید ۳ تا ۳۰ نویسه و شامل حروف، عدد، نقطه، خط تیره یا زیرخط باشد.",true);return;}
 if(password.length<8){message("signup-message","رمز عبور باید حداقل ۸ نویسه باشد.",true);return;}
 const submit=e.submitter; if(submit)submit.disabled=true;
 message("signup-message","در حال ساخت حساب...");
 try{
  const email=await syntheticEmail(username);
  const {data,error}=await db.auth.signUp({email,password,options:{data:{display_name:displayName,login_id:username,account_type:accountType}}});
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
async function enterApp(user){
 if(enteringUserId===user.id)return;enteringUserId=user.id;
 try{
  currentUser=user;show("auth-view",false);show("expired-subscription-view",false);show("app-view",true);$("today-date").textContent=dateLabel();
  await loadProfile();if(!currentUser)return;
  await loadFeatureFlags();
  if(profile?.is_approved===false){show("app-view",false);show("auth-view",false);show("pending-approval-view",true);return;}
  await Promise.all([loadTasks(),loadRoutines(),loadSettings(),loadAnnouncements(),loadHumorFeed()]);renderAll();syncSmartPlanner();startAnnouncementRealtime();startMessageRealtime();checkAppUpdateNotice();startUpdateMonitor();
 }catch(err){console.error("App loading failed:",err);show("app-view",false);show("auth-view",true);show("login-card",true);message("auth-message","خطا در ورود: "+(err.message||"خطای نامشخص"),true);throw err}
 finally{enteringUserId=null}
}
async function loadFeatureFlags(){
 const {data,error}=await db.from("app_feature_flags").select("chat_enabled,humor_enabled").eq("id",1).single();
 if(error)throw error;
 featureFlags={chat_enabled:data.chat_enabled!==false,humor_enabled:data.humor_enabled!==false};
 applyFeatureFlags();
}
function applyFeatureFlags(){
 $("chat-nav").classList.toggle("hidden",!featureFlags.chat_enabled&&!profile?.is_admin);
 document.querySelectorAll('[data-page="humor"]').forEach(b=>b.classList.toggle("hidden",!featureFlags.humor_enabled&&!profile?.is_admin));
 if($("feature-chat-toggle"))$("feature-chat-toggle").checked=featureFlags.chat_enabled;
 if($("feature-humor-toggle"))$("feature-humor-toggle").checked=featureFlags.humor_enabled;
 if(!featureFlags.chat_enabled&&!profile?.is_admin)stopChatRealtime();
 if(!featureFlags.humor_enabled&&!profile?.is_admin){$("humor-feed").textContent="این بخش موقتاً غیرفعال است.";const f=$("humor-submit-form");if(f)f.classList.add("hidden");}
 else {const f=$("humor-submit-form");if(f)f.classList.remove("hidden");}
}
$("feature-flags-form")?.addEventListener("submit",async e=>{
 e.preventDefault();const b=e.submitter;b.disabled=true;
 try{
  const result=await callAdmin("set_feature_flags",{chat_enabled:$("feature-chat-toggle").checked,humor_enabled:$("feature-humor-toggle").checked});
  featureFlags={chat_enabled:result.chat_enabled,humor_enabled:result.humor_enabled};applyFeatureFlags();toast("وضعیت بخش‌ها ذخیره شد.");
 }catch(x){$("feature-chat-toggle").checked=featureFlags.chat_enabled;$("feature-humor-toggle").checked=featureFlags.humor_enabled;toast(x.message)}
 finally{b.disabled=false}
});

async function loadProfile(){
 const {data,error}=await db.from("profiles").select("*").eq("id",currentUser.id).maybeSingle();
 if(error)throw error;profile=data||{display_name:"کاربر",is_admin:false,is_banned:false};
 if(profile.is_approved===false){show("app-view",false);show("auth-view",false);show("pending-approval-view",true);return;}
 if(profile.is_banned){show("app-view",false);show("auth-view",false);show("expired-subscription-view",false);show("banned-account-view",true);$("banned-user-name").textContent=profile.display_name||"کاربر";return}
 $("user-name").textContent=profile.display_name||"کاربر";$("user-avatar").textContent=profile.avatar_emoji|| (profile.display_name||"M").slice(0,1);$("school-grade-chip").textContent=schoolProfileLabel(profile)||"پایه یا کلاس ثبت نشده";
 show("admin-nav",!!profile.is_admin);show("announcement-admin-form",!!profile.is_admin);show("chat-nav",profile.chat_enabled!==false||!!profile.is_admin);
 if(profile.is_admin){$("subscription-label").textContent="مدیر سامانه";loadPendingUsers().catch(console.error);loadAdminHumor().catch(console.error);return;}
 const {data:subs,error:subError}=await db.from("subscriptions").select("starts_at,ends_at").eq("user_id",currentUser.id).order("ends_at",{ascending:false}).limit(1);
 if(subError)throw subError;
 const sub=subs?.[0],now=Date.now();
 if(!sub||new Date(sub.starts_at)>now||new Date(sub.ends_at)<now){$("subscription-label").textContent="اشتراک فعال نیست";show("app-view",false);show("auth-view",false);show("expired-subscription-view",true);$("expired-user-name").textContent=profile.display_name||"کاربر";$("expired-subscription-date").textContent=sub?.ends_at?"تاریخ پایان اشتراک: "+jalaliDate(sub.ends_at):"برای این حساب اشتراک فعالی ثبت نشده است.";return}
 $("subscription-label").textContent="اشتراک فعال تا "+jalaliDate(sub.ends_at);
}
async function loadTasks(){const {data,error}=await db.from("study_tasks").select("*").eq("user_id",currentUser.id).order("position").order("created_at",{ascending:false});if(error)throw error;tasks=data||[]}
async function loadRoutines(){const {data,error}=await db.from("routines").select("*").eq("user_id",currentUser.id).order("weekday").order("scheduled_time");if(error)throw error;routines=data||[]}
async function loadSettings(){const {data,error}=await db.from("planner_settings").select("*").eq("user_id",currentUser.id).maybeSingle();if(error)throw error;settings=data||{}}
function renderAll(){if(!currentUser)return;renderAnnouncements();renderTasks();renderRoutines();renderReports();syncProfileForm();$("welcome-title").textContent="سلام "+(profile.display_name||"")+", برنامه امروزت آماده است."; $("display-name").value=profile.display_name||"";$("sleep-hours").value=settings.sleep_hours??"";$("wake-time").value=settings.wake_time?.slice(0,5)||"";$("accent-theme").value=settings.accent_theme||"emerald";$("appearance").value=settings.appearance||settings.theme||"dark";$("humor-enabled").checked=!!settings.humor_enabled;applyTheme(settings.accent_theme||"emerald",settings.appearance||settings.theme||"dark");updateHumor()}
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
$("task-form").addEventListener("submit",async e=>{e.preventDefault();const title=$("task-title").value.trim();const due=$("task-due-date").value,time=$("task-due-time").value||"23:59";if($("task-due-date-jalali").value&&!due){toast("تقویم بارگذاری نشده یا تبدیل تاریخ انجام نشد؛ صفحه را تازه‌سازی کنید.");return}let dueAt=null;if(due){const d=new Date(due+"T00:00:00");if(Number.isNaN(d.getTime())){toast("تاریخ انتخاب‌شده معتبر نیست.");return}const [hh,mm]=time.split(":").map(Number);d.setHours(hh,mm,0,0);dueAt=d.toISOString()}const row={user_id:currentUser.id,title,description:$("task-description").value.trim(),priority:$("task-priority").value,status:"pending",position:tasks.length,...(dueAt?{due_at:dueAt}:{})};const {error}=await db.from("study_tasks").insert(row);if(error){toast(error.message);return}e.target.reset();await refreshTasks();toast("وظیفه ثبت شد.")});
$("routine-form").addEventListener("submit",async e=>{e.preventDefault();const row={user_id:currentUser.id,title:$("routine-title").value.trim(),details:$("routine-details").value.trim(),weekday:Number($("routine-weekday").value),scheduled_time:$("routine-time").value||null};const {error}=await db.from("routines").insert(row);if(error){toast(error.message);return}e.target.reset();await loadRoutines();renderRoutines();toast("برنامه ثابت اضافه شد.")});
document.addEventListener("click",async e=>{
 const profileBack=e.target.closest('#page-public-profile [data-page="humor"]');
 if(profileBack){navigate("humor");return}

 const check=e.target.closest("[data-task-check]");if(check){const id=check.dataset.taskCheck;const {error}=await db.from("study_tasks").update({status:check.checked?"done":"pending"}).eq("id",id).eq("user_id",currentUser.id);if(error)toast(error.message);else await refreshTasks();return}
 const del=e.target.closest("[data-task-delete]");if(del){if(!confirm("این وظیفه حذف شود؟"))return;const {error}=await db.from("study_tasks").delete().eq("id",del.dataset.taskDelete).eq("user_id",currentUser.id);if(error)toast(error.message);else{await refreshTasks();toast("وظیفه حذف شد.")}return}
 const rd=e.target.closest("[data-routine-delete]");if(rd){if(!confirm("این برنامه حذف شود؟"))return;const {error}=await db.from("routines").delete().eq("id",rd.dataset.routineDelete).eq("user_id",currentUser.id);if(error)toast(error.message);else{await loadRoutines();renderRoutines();toast("برنامه حذف شد.")}return}
 const go=e.target.closest("[data-go]");if(go)navigate(go.dataset.go);
 const thread=e.target.closest("[data-chat-user]");if(thread){chatTargetUserId=thread.dataset.chatUser;loadSupportChat().catch(err=>message("chat-message",err.message,true));return}
 const nav=e.target.closest("[data-page]");if(nav)navigate(nav.dataset.page);
});

let chatChannel=null,chatTargetUserId=null,messageNoticeChannel=null;
const PUSH_PUBLIC_KEY="BA18A8ln4zGToMNrHhAT5Q72Vbp-PXFWKTxHqCXDlH_p3xXpqJgha3kvMxY_VYCQuDLHf15xpmOLeG-6w-7aW8E";
function base64UrlToBytes(value){const padding="=".repeat((4-value.length%4)%4);const raw=atob((value+padding).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}
async function syncPushStatus(){
 const el=$("push-status");if(!el)return;
 if(!("Notification"in window)||!window.isSecureContext){el.textContent="این مرورگر از اعلان پشتیبانی نمی‌کند.";return}
 const reg=await navigator.serviceWorker?.getRegistration();const sub=await reg?.pushManager?.getSubscription();
 el.textContent=sub?"اعلان پیام‌ها فعال است.":Notification.permission==="denied"?"اعلان‌ها در تنظیمات مرورگر مسدود شده‌اند.":"اعلان پیام‌ها هنوز فعال نشده است.";
}
async function enablePushNotifications(){
 const btn=$("enable-push");btn.disabled=true;
 try{
  if(!("Notification"in window)||!window.isSecureContext||!("serviceWorker"in navigator))throw new Error("مرورگر یا اتصال امن از اعلان پشتیبانی نمی‌کند.");
  const permission=await Notification.requestPermission();if(permission!=="granted")throw new Error("اجازه اعلان داده نشد. از تنظیمات مرورگر، اعلان‌ها را فعال کن.");
  const reg=await navigator.serviceWorker.register("./service-worker.js");let sub=await reg.pushManager.getSubscription();
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:base64UrlToBytes(PUSH_PUBLIC_KEY)});
  const {error}=await db.functions.invoke("push-notify",{body:{action:"subscribe",subscription:sub.toJSON()}});if(error)throw error;
  toast("اعلان پیام‌ها فعال شد.");await syncPushStatus();
 }catch(err){console.error("Push setup failed",err);toast(err.message||"فعال‌سازی اعلان ناموفق بود.");await syncPushStatus()}
 finally{btn.disabled=false}
}
$("enable-push")?.addEventListener("click",enablePushNotifications);
async function startMessageRealtime(){
 if(messageNoticeChannel){await db.removeChannel(messageNoticeChannel);messageNoticeChannel=null}
 if(!currentUser)return;
 messageNoticeChannel=db.channel("mmd-message-notices").on("postgres_changes",{event:"INSERT",schema:"public",table:"private_messages"},async payload=>{
  const msg=payload.new;if(!msg||msg.sender_id===currentUser.id)return;
  try{const {data:conv,error}=await db.from("private_conversations").select("user_one,user_two").eq("id",msg.conversation_id).maybeSingle();if(error||!conv||![conv.user_one,conv.user_two].includes(currentUser.id))return;if(document.visibilityState==="visible")toast("پیام جدید دریافت شد.");}
  catch(err){console.debug("Message notice skipped",err)}
 }).subscribe();
 syncPushStatus().catch(()=>{});
}
function stopMessageRealtime(){if(messageNoticeChannel){db.removeChannel(messageNoticeChannel);messageNoticeChannel=null}}
function stopChatRealtime(){if(chatChannel){db.removeChannel(chatChannel);chatChannel=null}}
function startChatRealtime(){stopChatRealtime();chatChannel=db.channel("private-chat").on("postgres_changes",{event:"*",schema:"public",table:"private_messages"},()=>{if(!$("page-chat").classList.contains("hidden"))loadSupportChat().catch(e=>message("chat-message",e.message,true))}).subscribe()}
async function loadSupportChat(){
 if(!currentUser)return;
 if(profile?.chat_enabled===false&&!profile?.is_admin){show("chat-content",false);$("chat-status").textContent="دسترسی چت غیرفعال است.";return}
 show("chat-content",true);
 const {data:convs,error}=await db.from("private_conversations").select("*").order("created_at",{ascending:false});if(error)throw error;
 const {data:profiles,error:pe}=await db.from("profiles").select("id,display_name,chat_enabled").eq("is_approved",true);if(pe)throw pe;
 const names=new Map((profiles||[]).map(p=>[p.id,p.display_name||"کاربر"]));
 const list=$("chat-inbox-list");
 if(profile?.is_admin){list.innerHTML=(convs||[]).map(c=>'<button class="chat-thread" data-conv="'+c.id+'"><b>'+escapeHtml(names.get(c.user_one)||"کاربر")+" ↔ "+escapeHtml(names.get(c.user_two)||"کاربر")+'</b></button>').join("")||'<div class="empty">گفت‌وگویی نیست.</div>'}
 else {list.innerHTML=(profiles||[]).filter(p=>p.id!==currentUser.id&&p.chat_enabled!==false).map(p=>'<button class="chat-thread" data-person="'+p.id+'">'+escapeHtml(p.display_name||"کاربر")+'</button>').join("")||'<div class="empty">کاربر دیگری در دسترس نیست.</div>'}
 if(!chatTargetUserId&&profile?.is_admin&&convs?.length)chatTargetUserId=convs[0].id;
 let conv=(convs||[]).find(c=>c.id===chatTargetUserId);
 if(!conv&&!profile?.is_admin&&chatTargetUserId){const pair=currentUser.id<chatTargetUserId?[currentUser.id,chatTargetUserId]:[chatTargetUserId,currentUser.id];const q=await db.from("private_conversations").select("*").eq("user_one",pair[0]).eq("user_two",pair[1]).maybeSingle();if(q.error)throw q.error;conv=q.data;if(!conv){const r=await db.from("private_conversations").insert({user_one:pair[0],user_two:pair[1]}).select().single();if(r.error)throw r.error;conv=r.data}}
 if(!conv){$("chat-heading-title").textContent="یک کاربر را انتخاب کنید";$("chat-messages").innerHTML="برای شروع یک کاربر را انتخاب کنید.";return}
 chatTargetUserId=conv.id;const other=conv.user_one===currentUser.id?conv.user_two:conv.user_one;$("chat-heading-title").textContent=names.get(other)||"گفت‌وگو";
 const {data:msgs,error:me}=await db.from("private_messages").select("*").eq("conversation_id",conv.id).order("created_at");if(me)throw me;
 const rendered=await Promise.all((msgs||[]).map(async m=>{let media="";if(m.media_path&&!m.deleted_at){const z=await db.storage.from("private-chat-media").createSignedUrl(m.media_path,1800);if(z.data?.signedUrl){const u=z.data.signedUrl;if((m.media_type||"").startsWith("image/"))media='<img src="'+u+'" style="max-width:220px;max-height:220px" alt="تصویر">';else if((m.media_type||"").startsWith("video/"))media='<video controls playsinline src="'+u+'" style="max-width:240px"></video>';else media='<a href="'+u+'" target="_blank">مشاهده فایل</a>'}}return '<article class="chat-bubble"><p>'+(m.deleted_at?"پیام حذف شده":escapeHtml(m.body||""))+'</p>'+media+(m.sender_id===currentUser.id&&!m.deleted_at?'<button data-delete-msg="'+m.id+'">حذف پیام</button>':"")+"</article>"}));
 $("chat-messages").innerHTML=rendered.join("");
}
$("chat-inbox-list").addEventListener("click",async e=>{const p=e.target.closest("[data-person]"),c=e.target.closest("[data-conv]");if(p)chatTargetUserId=p.dataset.person;else if(c)chatTargetUserId=c.dataset.conv;else return;try{await loadSupportChat()}catch(x){message("chat-message",x.message,true)}});
$("chat-form").addEventListener("submit",async e=>{e.preventDefault();if(!chatTargetUserId)return;const body=$("chat-input").value.trim(),file=$("chat-file").files[0];if(!body&&!file)return;try{let path=null,type=null;if(file){if(file.size>52428800)throw Error("حداکثر حجم فایل ۵۰ مگابایت است.");path=currentUser.id+"/"+crypto.randomUUID()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");const up=await db.storage.from("private-chat-media").upload(path,file,{contentType:file.type});if(up.error)throw up.error;type=file.type}const messageId=crypto.randomUUID();const r=await db.from("private_messages").insert({id:messageId,conversation_id:chatTargetUserId,sender_id:currentUser.id,body,media_path:path,media_type:type});if(r.error)throw r.error;db.functions.invoke("push-notify",{body:{action:"send",conversation_id:chatTargetUserId,message_id:messageId}}).then(({error})=>{if(error)console.warn("Push send skipped",error)});$("chat-input").value="";$("chat-file").value="";await loadSupportChat()}catch(x){message("chat-message",x.message,true)}});
$("chat-messages").addEventListener("click",async e=>{const b=e.target.closest("[data-delete-msg]");if(!b||!confirm("پیام حذف شود؟"))return;const r=await db.from("private_messages").update({deleted_at:new Date().toISOString(),body:"",media_path:null,media_type:null}).eq("id",b.dataset.deleteMsg).eq("sender_id",currentUser.id);if(r.error)message("chat-message",r.error.message,true);else loadSupportChat()});

function navigate(page){if(page==="chat"&&!featureFlags.chat_enabled&&!profile?.is_admin){toast("بخش چت غیرفعال است.");page="today"}if(page==="humor"&&!featureFlags.humor_enabled&&!profile?.is_admin){toast("بخش همتانه غیرفعال است.");page="today"}document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));show("page-"+page,true);document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));const titles={"public-profile":"پروفایل کاربر",today:"امروز","today-work":"کارهای امروز",profile:"پروفایل من",announcements:"اعلانات",contact:"ارتباط با ادمین",chat:"چت با ادمین",smart:"برنامه‌ریز هوشمند",tasks:"وظایف و تکالیف",routines:"برنامه ثابت",reports:"گزارش پیشرفت",settings:"تنظیمات",admin:"مدیریت کاربران"};if(page==="smart"&&!smartEnabled())page="today";$("page-title").textContent=titles[page]||"امروز";if(page==="admin")loadAdminUsers().catch(e=>message("admin-message",e.message,true));if(page==="chat"){chatTargetUserId=null;loadSupportChat().then(startChatRealtime).catch(e=>message("chat-message",e.message,true))}else stopChatRealtime()}
document.querySelector("#page-public-profile [data-page=humor]")?.addEventListener("click",()=>navigate("humor"));
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{taskFilter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));renderTasks()}));
$("smart-planner-toggle").addEventListener("change",e=>{if(e.target.checked)localStorage.setItem(smartKey(),"on");else localStorage.removeItem(smartKey());syncSmartPlanner();toast(e.target.checked?"برنامه‌ریز هوشمند فعال شد.":"برنامه‌ریز هوشمند غیرفعال شد.");});
function buildSmartPlan(){
 const open=tasks.filter(t=>t.status==="pending").sort((a,b)=>{const ad=a.due_at?new Date(a.due_at).getTime():Infinity,bd=b.due_at?new Date(b.due_at).getTime():Infinity;return ad-bd||(a.priority==="high"?-1:0)-(b.priority==="high"?-1:0)});
 if(!open.length){$("smart-plan-output").innerHTML='<div class="empty">وظیفه باز برای زمان‌بندی وجود ندارد.</div>';return;}
 const duration=Number($("smart-session").value),rest=Number($("smart-break").value);let cursor=new Date();cursor.setMinutes(Math.ceil(cursor.getMinutes()/15)*15,0,0);const rows=[];
 for(const t of open){if(t.due_at&&new Date(t.due_at)<cursor){rows.push({task:t,late:true,start:new Date(cursor)});continue;}let start=new Date(cursor);if(t.due_at&&start.getTime()+duration*60000>new Date(t.due_at).getTime()){rows.push({task:t,late:true,start});continue;}rows.push({task:t,start,late:false});cursor=new Date(cursor.getTime()+(duration+rest)*60000);}
 $("smart-plan-output").innerHTML=rows.map(x=>'<article class="task-item"><div class="task-main"><h3>'+escapeHtml(x.task.title)+'</h3><p>'+(x.late?'مهلت گذشته یا زمان کافی تا مهلت وجود ندارد':'پیشنهاد شروع: '+jalaliDate(x.start,true))+'</p></div><span class="priority '+(x.late?'high':'')+'">'+(x.late?'نیازمند بررسی':duration+' دقیقه')+'</span></article>').join("");
}
$("smart-generate").addEventListener("click",()=>{if(!smartEnabled()){toast("ابتدا این قابلیت را در تنظیمات فعال کنید.");return;}buildSmartPlan()});
$("smart-clear").addEventListener("click",()=>{$("smart-plan-output").innerHTML='<div class="empty">پیشنهاد پاک شد.</div>'});
$("settings-form").addEventListener("submit",async e=>{e.preventDefault();const row={user_id:currentUser.id,sleep_hours:$("sleep-hours").value?Number($("sleep-hours").value):null,wake_time:$("wake-time").value||null,theme:$("appearance").value,accent_theme:$("accent-theme").value,appearance:$("appearance").value,humor_enabled:$("humor-enabled").checked};const {error}=await db.from("planner_settings").upsert(row,{onConflict:"user_id"});if(error){toast(error.message);return}settings=row;profile.display_name=$("display-name").value.trim()||"کاربر";const {error:pe}=await db.from("profiles").update({display_name:profile.display_name}).eq("id",currentUser.id);if(pe){toast(pe.message);return} $("user-name").textContent=profile.display_name;$("user-avatar").textContent=profile.display_name.slice(0,1);applyTheme(row.accent_theme,row.appearance);updateHumor();toast("تنظیمات ذخیره شد.")});
function applyTheme(accent="emerald",appearance="dark"){document.body.dataset.theme=accent;document.body.dataset.appearance=appearance;document.body.classList.toggle("light",appearance==="light"||(appearance==="system"&&matchMedia("(prefers-color-scheme: light)").matches));document.documentElement.dataset.font="vazirmatn"}
const humorLines=["اگر تکلیف‌ها خودشان انجام می‌شدند، احتمالاً الان اینجا نبودیم!","یک قدم کوچک هم از صفر کیلومتر جلوتر است.","مغزت را روشن کن؛ حالت پرواز برای بعد از درس!","امروز با خودت رقابت کن، نه با کل دنیا.","استراحت کوتاه مجاز است؛ ناپدید شدن سه‌ساعته نه!","هر تیک، یک پیروزی کوچک است."];
function updateHumor(){const enabled=!!settings.humor_enabled;$("welcome-mood").textContent=enabled?humorLines[Math.floor(Math.random()*humorLines.length)]:"کارها را انجام بده و پیشرفتت را ثبت کن."}

async function loadAnnouncements(){const {data,error}=await db.from("announcements").select("id,title,body,created_at,created_by").eq("published",true).order("created_at",{ascending:false});if(error)throw error;window.__announcements=data||[]}
let announcementChannel=null;
function stopAnnouncementRealtime(){if(announcementChannel){db.removeChannel(announcementChannel);announcementChannel=null}}
function startAnnouncementRealtime(){
 stopAnnouncementRealtime();
 announcementChannel=db.channel("mmd-announcements").on("postgres_changes",{event:"INSERT",schema:"public",table:"announcements"},payload=>{
  const item=payload.new;if(!item?.published||item.created_by===currentUser?.id)return;
  if(!window.__announcements?.some(x=>x.id===item.id)){window.__announcements=[item,...(window.__announcements||[])];renderAnnouncements();toast("اطلاعیه جدید: "+(item.title||"اطلاعیه"));}
 }).subscribe();
}
const SCHOOL_CLASSES={"هفتم":["هدف","مسئولیت"],"هشتم":["تلاش","کوشش"],"نهم":["اراده","استقامت"],"معلم":[]};
function schoolProfileLabel(p){if(!p?.school_grade)return "";return p.school_grade==="معلم"?"معلم":p.school_grade+(p.school_class?" · کلاس "+p.school_class:"");}
function syncSchoolClassOptions(selected=""){const grade=$("profile-grade").value,classes=SCHOOL_CLASSES[grade]||[],select=$("profile-class"),wrap=$("profile-class-wrap");select.innerHTML="";if(grade==="معلم"){wrap.classList.add("hidden");select.required=false;select.disabled=true;return}wrap.classList.remove("hidden");select.required=!!grade;select.disabled=!grade;const first=document.createElement("option");first.value="";first.textContent=grade?"انتخاب کلاس":"ابتدا پایه را انتخاب کنید";select.append(first);classes.forEach(name=>{const o=document.createElement("option");o.value=name;o.textContent=name;select.append(o)});select.value=selected;}
function syncProfileForm(){if(profile?.avatar_path){const u=db.storage.from("profile-avatars").getPublicUrl(profile.avatar_path).data.publicUrl;$("profile-preview-avatar").innerHTML='<img src="'+u+'" alt="تصویر پروفایل">'}else $("profile-preview-avatar").textContent=profile?.avatar_emoji||"🌙";
 $("profile-name").value=profile?.display_name||"";
 $("profile-bio").value=profile?.bio||"";
 $("profile-avatar").value=profile?.avatar_emoji||"🌙";
 $("profile-color").value=profile?.profile_color||"violet";
 $("profile-grade").value=profile?.account_type==="teacher"?"معلم":(profile?.school_grade||"");$("profile-grade").disabled=profile?.account_type==="teacher";syncSchoolClassOptions(profile?.school_class||"");
 updateProfilePreview();
}
function updateProfilePreview(){
 const name=$("profile-name").value.trim()||"کاربر MMD",bio=$("profile-bio").value.trim()||"اینجا معرفی کوتاهی از خودت بنویس.",avatar=$("profile-avatar").value,color=$("profile-color").value;
 $("profile-preview-name").textContent=name;$("profile-preview-bio").textContent=bio;$("profile-preview-avatar").textContent=avatar;
 $("profile-preview").dataset.color=color;
 const badge=schoolProfileLabel({school_grade:$("profile-grade").value,school_class:$("profile-class").value});$("profile-school-badge").textContent=badge||"پایه و کلاس را انتخاب کنید";
}
["profile-name","profile-bio","profile-avatar","profile-color"].forEach(id=>$(id).addEventListener("input",updateProfilePreview));
$("profile-grade").addEventListener("change",()=>{syncSchoolClassOptions();updateProfilePreview()});$("profile-class").addEventListener("change",updateProfilePreview);
$("profile-form").addEventListener("submit",async e=>{
 e.preventDefault();const btn=e.submitter;btn.disabled=true;message("profile-message","در حال ذخیره...");
 const display_name=$("profile-name").value.trim()||"کاربر",bio=$("profile-bio").value.trim(),avatar_emoji=$("profile-avatar").value,profile_color=$("profile-color").value,school_grade=profile.account_type==="teacher"?"معلم":$("profile-grade").value,school_class=school_grade==="معلم"?null:$("profile-class").value;
 if(!school_grade||(school_grade!=="معلم"&&!school_class)){message("profile-message","پایه و نام کلاس را انتخاب کنید.",true);btn.disabled=false;return}
 const {error}=await db.from("profiles").update({display_name,bio,avatar_emoji,profile_color,school_grade,school_class}).eq("id",currentUser.id);
 if(error){message("profile-message",error.message,true);btn.disabled=false;return}
 profile={...profile,display_name,bio,avatar_emoji,profile_color,school_grade,school_class};$("profile-grade").disabled=profile.account_type==="teacher";
 $("user-name").textContent=display_name;$("user-avatar").textContent=avatar_emoji;$("school-grade-chip").textContent=schoolProfileLabel(profile);updateProfilePreview();document.body.dataset.profileColor=profile_color;$("welcome-title").textContent="سلام "+display_name+", برنامه امروزت آماده است.";
 document.body.dataset.profileColor=profile_color;message("profile-message","پروفایل ذخیره شد.");btn.disabled=false;
});
function renderAnnouncements(){const rows=window.__announcements||[];$("announcement-list").innerHTML=rows.length?rows.map(a=>'<article class="form-panel"><div class="section-head"><h3>'+escapeHtml(a.title)+'</h3><small class="muted">'+jalaliDate(a.created_at)+'</small></div><p style="white-space:pre-wrap;line-height:2">'+escapeHtml(a.body)+'</p>'+(profile?.is_admin?'<button class="icon-btn" data-delete-announcement="'+a.id+'">حذف اطلاعیه</button>':"")+'</article>').join(""):'<div class="empty">در حال حاضر اطلاعیه‌ای منتشر نشده است.</div>'}
$("announcement-admin-form").addEventListener("submit",async e=>{e.preventDefault();const row={title:$("announcement-title").value.trim(),body:$("announcement-body").value.trim(),created_by:currentUser.id,published:true};const {error}=await db.from("announcements").insert(row);if(error){message("announcement-message",error.message,true);return}e.target.reset();await loadAnnouncements();renderAnnouncements();message("announcement-message","اطلاعیه منتشر شد.")});
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
$("admin-humor-list").addEventListener("click",async e=>{const b=e.target.closest("[data-publish],[data-decline]");if(!b)return;try{await callAdmin("review_humor_post",{post_id:b.dataset.publish||b.dataset.decline,status:b.dataset.publish?"approved":"rejected"});await loadAdminHumor()}catch(x){toast(x.message)}});
async function loadHumorFeed(){
 if(!currentUser)return;
 if(!featureFlags.humor_enabled&&!profile?.is_admin){$("humor-feed").textContent="این بخش موقتاً غیرفعال است.";return}
 const q=await db.from("humor_posts").select("id,user_id,title,body,media_path,media_type,created_at").eq("status","approved").order("created_at",{ascending:false});if(q.error)throw q.error;
 const ids=[...new Set((q.data||[]).map(p=>p.user_id))];
 const pr=ids.length?await db.from("profiles").select("id,display_name,bio,avatar_emoji,avatar_path").in("id",ids):{data:[],error:null};if(pr.error)throw pr.error;
 const likes=await db.from("humor_post_likes").select("post_id,user_id");if(likes.error)throw likes.error;
 const comments=await db.from("humor_post_comments").select("id,post_id,user_id,body,created_at").order("created_at");if(comments.error)throw comments.error;
 const people=new Map((pr.data||[]).map(p=>[p.id,p]));const feed=$("humor-feed");feed.innerHTML="";
 for(const p of q.data||[]){
  const u=people.get(p.user_id)||{};const card=document.createElement("article");card.className="post-card";
  const author=document.createElement("button");author.className="post-author-link";author.type="button";
  const av=u.avatar_path?db.storage.from("profile-avatars").getPublicUrl(u.avatar_path).data.publicUrl:"";
  if(av){const img=document.createElement("img");img.src=av;img.alt="";author.append(img)}else{const span=document.createElement("span");span.className="post-avatar";span.textContent=u.avatar_emoji||"🌙";author.append(span)}
  const name=document.createElement("b");name.textContent=u.display_name||"کاربر";author.append(name);author.addEventListener("click",()=>openPublicProfile(p.user_id).catch(x=>toast(x.message)));card.append(author);
  const title=document.createElement("h3");title.textContent=p.title;card.append(title);
  const body=document.createElement("p");body.className="post-body";body.textContent=p.body||"";card.append(body);
  if(p.media_path){const z=await db.storage.from("humor-media").createSignedUrl(p.media_path,3600);if(z.data?.signedUrl){if(p.media_type==="video"){const video=document.createElement("video");video.controls=true;video.playsInline=true;video.controlsList="nodownload";video.disablePictureInPicture=true;video.src=z.data.signedUrl;card.append(video);const dl=document.createElement("button");dl.className="secondary download-request";dl.textContent="⬇ درخواست دانلود";dl.addEventListener("click",async()=>{const x=await db.from("profiles").select("login_id,phone").eq("is_admin",true).not("login_id","is",null).limit(1).maybeSingle();if(x.error){toast(x.error.message);return}alert("برای دانلود ویدئو باید اشتراک دانلود را از ادمین بخرید.\nشناسه مدیر: "+(x.data?.login_id||x.data?.phone||"از بخش ارتباط با مدیر"))});card.append(dl)}else{const img=document.createElement("img");img.src=z.data.signedUrl;img.alt="";img.style.maxWidth="100%";card.append(img)}}}
  const pl=(likes.data||[]).filter(x=>x.post_id===p.id),liked=pl.some(x=>x.user_id===currentUser.id);
  const like=document.createElement("button");like.className="secondary";like.textContent=(liked?"♥ ":"♡ ")+fa(pl.length)+" پسند";like.addEventListener("click",async()=>{const old=await db.from("humor_post_likes").select("id").eq("post_id",p.id).eq("user_id",currentUser.id).maybeSingle();if(old.error){toast(old.error.message);return}const res=old.data?await db.from("humor_post_likes").delete().eq("id",old.data.id):await db.from("humor_post_likes").insert({post_id:p.id,user_id:currentUser.id});if(res.error){toast(res.error.message);return}await loadHumorFeed()});card.append(like);
  const postComments=(comments.data||[]).filter(x=>x.post_id===p.id);
  for(const c of postComments){const item=document.createElement("div");item.className="post-comment";item.textContent=c.body;card.append(item)}
  const form=document.createElement("form");form.className="post-comment-form";const input=document.createElement("input");input.name="comment";input.maxLength=1000;input.placeholder="دیدگاه بنویس...";input.required=true;const send=document.createElement("button");send.className="primary";send.textContent="ارسال";form.append(input,send);form.addEventListener("submit",async ev=>{ev.preventDefault();const res=await db.from("humor_post_comments").insert({post_id:p.id,user_id:currentUser.id,body:input.value.trim()});if(res.error){toast(res.error.message);return}await loadHumorFeed()});card.append(form);feed.append(card);
 }
 if(!q.data?.length)feed.textContent="هنوز مطلبی منتشر نشده است.";
}
async function openPublicProfile(id){
 const q=await db.from("profiles").select("id,display_name,bio,avatar_emoji,avatar_path,school_grade,school_class,account_type").eq("id",id).maybeSingle();if(q.error)throw q.error;if(!q.data)return;
 const p=q.data,posts=await db.from("humor_posts").select("title,body").eq("user_id",id).eq("status","approved").order("created_at",{ascending:false});if(posts.error)throw posts.error;
 const root=$("public-profile-content");root.innerHTML="";const h=document.createElement("h2");h.textContent=p.display_name||"کاربر";root.append(h);const bio=document.createElement("p");bio.textContent=p.bio||"توضیحی ثبت نشده است.";root.append(bio);const school=document.createElement("p");school.className="school-profile-badge";school.textContent=schoolProfileLabel(p)||"پایه یا کلاس ثبت نشده";root.append(school);
 if(p.avatar_path){const img=document.createElement("img");img.src=db.storage.from("profile-avatars").getPublicUrl(p.avatar_path).data.publicUrl;img.style.width="110px";img.style.borderRadius="50%";root.prepend(img)}
 const heading=document.createElement("h3");heading.textContent="مطالب منتشرشده";root.append(heading);for(const x of posts.data||[]){const card=document.createElement("article");card.className="form-panel";const t=document.createElement("h3");t.textContent=x.title;const b=document.createElement("p");b.textContent=x.body||"";card.append(t,b);root.append(card)}
 navigate("public-profile");
}
$("profile-photo").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;if(f.size>5242880||!/^image\/(jpeg|png|webp)$/.test(f.type)){toast("تصویر باید JPG، PNG یا WebP و حداکثر ۵ مگابایت باشد.");return}const path=currentUser.id+"/"+crypto.randomUUID()+"-"+f.name.replace(/[^a-zA-Z0-9._-]/g,"_");const u=await db.storage.from("profile-avatars").upload(path,f,{contentType:f.type});if(u.error){toast(u.error.message);return}const z=await db.from("profiles").update({avatar_path:path}).eq("id",currentUser.id);if(z.error){toast(z.error.message);return}profile.avatar_path=path;const url=db.storage.from("profile-avatars").getPublicUrl(path).data.publicUrl;$("profile-preview-avatar").innerHTML='<img src="'+url+'" alt="تصویر پروفایل">';toast("تصویر پروفایل ذخیره شد.")});

$("humor-submit-form").addEventListener("submit",async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{let path=null,type="text";const f=$("humor-file").files[0];if(f){if(f.size>52428800)throw new Error("حداکثر حجم فایل ۵۰ مگابایت است.");type=f.type.startsWith("video/")?"video":"image";path=currentUser.id+"/"+crypto.randomUUID()+"-"+f.name.replace(/[^a-zA-Z0-9._-]/g,"_");const {error}=await db.storage.from("humor-media").upload(path,f,{contentType:f.type});if(error)throw error}const {error}=await db.from("humor_posts").insert({user_id:currentUser.id,title:$("humor-title").value.trim(),body:$("humor-body").value.trim(),media_path:path,media_type:type,status:"pending"});if(error)throw error;e.target.reset();message("humor-submit-message","ارسال شد و منتظر تأیید مدیر است.");}catch(x){message("humor-submit-message",x.message,true)}finally{b.disabled=false}});
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
  const labels={profiles:"کاربران",subscriptions:"اشتراک‌ها",study_tasks:"وظایف",routines:"برنامه ثابت",planner_settings:"تنظیمات",announcements:"اطلاعیه‌ها",support_messages:"پیام‌ها",auth_accounts:"حساب‌های ورود",humor_posts:"همتانه"};
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
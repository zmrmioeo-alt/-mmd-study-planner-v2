/* MMD Study Planner - client application */
const SUPABASE_URL = "https://tbmxbtbayqgfvdlmeuaz.supabase.co";
const SUPABASE_KEY = "sb_publishable_n89FjocOtomNmAReFaP-vg_PMFbVow3";
const ADMIN_FUNCTION = SUPABASE_URL + "/functions/v1/admin-manage";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = (id) => document.getElementById(id);
const fa = (n) => new Intl.NumberFormat("fa-IR").format(n);
const weekdays = ["یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه","شنبه"];
let currentUser = null, profile = null, tasks = [], routines = [], settings = {}, taskFilter = "all";
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
 try{localStorage.setItem("mmd_terms_accepted","mmd-terms-2026-11-v1");await continueAfterPolicy()}
 catch(err){console.error(err);message("terms-message","ذخیره تأیید قوانین ممکن نشد. تنظیمات مرورگر را بررسی کنید.",true)}
});
async function boot(){
 if(localStorage.getItem("mmd_terms_accepted")!=="mmd-terms-2026-11-v1"){show("terms-view",true);show("auth-view",false);show("app-view",false);return}
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
async function enterApp(user){
 if(enteringUserId===user.id)return;enteringUserId=user.id;
 try{
  currentUser=user;show("auth-view",false);show("expired-subscription-view",false);show("app-view",true);$("today-date").textContent=dateLabel();
  await loadProfile();if(!currentUser)return;
  await Promise.all([loadTasks(),loadRoutines(),loadSettings(),loadAnnouncements()]);renderAll();syncSmartPlanner();
 }catch(err){console.error("App loading failed:",err);show("app-view",false);show("auth-view",true);show("login-card",true);message("auth-message","خطا در ورود: "+(err.message||"خطای نامشخص"),true);throw err}
 finally{enteringUserId=null}
}
async function loadProfile(){
 const {data,error}=await db.from("profiles").select("*").eq("id",currentUser.id).maybeSingle();
 if(error)throw error;profile=data||{display_name:"کاربر",is_admin:false,is_banned:false};
 if(profile.is_banned){show("app-view",false);show("auth-view",false);show("expired-subscription-view",false);show("banned-account-view",true);$("banned-user-name").textContent=profile.display_name||"کاربر";return}
 $("user-name").textContent=profile.display_name||"کاربر";$("user-avatar").textContent=profile.avatar_emoji|| (profile.display_name||"M").slice(0,1);
 show("admin-nav",!!profile.is_admin);show("announcement-admin-form",!!profile.is_admin);
 if(profile.is_admin){$("subscription-label").textContent="مدیر سامانه";return;}
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
$("task-form").addEventListener("submit",async e=>{e.preventDefault();const title=$("task-title").value.trim();const due=$("task-due-date").value.trim(),time=$("task-due-time").value||"23:59";let dueAt=null;try{if(due){const d=jalaliInputToDate(due);const [hh,mm]=time.split(":").map(Number);d.setHours(hh,mm,0,0);dueAt=d.toISOString();}}catch(err){toast(err.message);return}const row={user_id:currentUser.id,title,description:$("task-description").value.trim(),priority:$("task-priority").value,status:"pending",position:tasks.length,...(dueAt?{due_at:dueAt}:{})};const {error}=await db.from("study_tasks").insert(row);if(error){toast(error.message);return}e.target.reset();await refreshTasks();toast("وظیفه ثبت شد.")});
$("routine-form").addEventListener("submit",async e=>{e.preventDefault();const row={user_id:currentUser.id,title:$("routine-title").value.trim(),details:$("routine-details").value.trim(),weekday:Number($("routine-weekday").value),scheduled_time:$("routine-time").value||null};const {error}=await db.from("routines").insert(row);if(error){toast(error.message);return}e.target.reset();await loadRoutines();renderRoutines();toast("برنامه ثابت اضافه شد.")});
document.addEventListener("click",async e=>{
 const check=e.target.closest("[data-task-check]");if(check){const id=check.dataset.taskCheck;const {error}=await db.from("study_tasks").update({status:check.checked?"done":"pending"}).eq("id",id).eq("user_id",currentUser.id);if(error)toast(error.message);else await refreshTasks();return}
 const del=e.target.closest("[data-task-delete]");if(del){if(!confirm("این وظیفه حذف شود؟"))return;const {error}=await db.from("study_tasks").delete().eq("id",del.dataset.taskDelete).eq("user_id",currentUser.id);if(error)toast(error.message);else{await refreshTasks();toast("وظیفه حذف شد.")}return}
 const rd=e.target.closest("[data-routine-delete]");if(rd){if(!confirm("این برنامه حذف شود؟"))return;const {error}=await db.from("routines").delete().eq("id",rd.dataset.routineDelete).eq("user_id",currentUser.id);if(error)toast(error.message);else{await loadRoutines();renderRoutines();toast("برنامه حذف شد.")}return}
 const go=e.target.closest("[data-go]");if(go)navigate(go.dataset.go);
 const thread=e.target.closest("[data-chat-user]");if(thread){chatTargetUserId=thread.dataset.chatUser;loadSupportChat().catch(err=>message("chat-message",err.message,true));return}
 const nav=e.target.closest("[data-page]");if(nav)navigate(nav.dataset.page);
});

let chatChannel=null,chatTargetUserId=null,chatMessages=[];
function stopChatRealtime(){if(chatChannel){db.removeChannel(chatChannel);chatChannel=null}}
function startChatRealtime(){
 stopChatRealtime();
 chatChannel=db.channel("support-chat-"+currentUser.id)
  .on("postgres_changes",{event:"*",schema:"public",table:"support_messages"},()=>{if(!$("page-chat").classList.contains("hidden"))loadSupportChat().catch(e=>message("chat-message",e.message,true))})
  .subscribe();
}
async function loadSupportChat(){
 if(!currentUser)return;
 const admin=!!profile?.is_admin;show("chat-inbox-panel",admin);
 if(admin){
  const {data,error}=await db.from("support_messages").select("*").order("created_at",{ascending:true});if(error)throw error;
  const all=data||[],ids=[...new Set(all.map(m=>m.user_id))];
  const peopleResult=ids.length?await db.from("profiles").select("id,display_name").in("id",ids):{data:[],error:null};
  if(peopleResult.error)throw peopleResult.error;
  const names=new Map((peopleResult.data||[]).map(p=>[p.id,p.display_name||"کاربر"])),latest=new Map();
  for(const m of all)latest.set(m.user_id,m);
  const threads=[...latest.entries()].map(([id,m])=>({id,name:names.get(id)||"کاربر",last:m.body,created_at:m.created_at})).sort((x,y)=>new Date(y.created_at)-new Date(x.created_at));
  $("chat-inbox-list").innerHTML=threads.length?threads.map(t=>'<button type="button" class="chat-thread '+(chatTargetUserId===t.id?'active':'')+'" data-chat-user="'+t.id+'"><b>'+escapeHtml(t.name)+'</b><small>'+escapeHtml(t.last)+'</small></button>').join(""):'<div class="empty">هنوز پیامی دریافت نشده است.</div>';
  if(!chatTargetUserId&&threads.length)chatTargetUserId=threads[0].id;
  if(chatTargetUserId&&!threads.some(t=>t.id===chatTargetUserId))chatTargetUserId=threads[0]?.id||null;
  const selected=threads.find(t=>t.id===chatTargetUserId);
  $("chat-heading-title").textContent=selected?selected.name:"گفت‌وگوها";
  $("chat-heading-subtitle").textContent=selected?"پاسخ شما برای این کاربر ارسال می‌شود.":"با دریافت پیام جدید، گفت‌وگو اینجا نمایش داده می‌شود.";
  chatMessages=all.filter(m=>m.user_id===chatTargetUserId);
 }else{
  chatTargetUserId=currentUser.id;$("chat-heading-title").textContent="پشتیبانی MMD";
  $("chat-heading-subtitle").textContent="پیام شما فقط برای مدیر سامانه قابل مشاهده است.";
  const {data,error}=await db.from("support_messages").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:true});
  if(error)throw error;chatMessages=data||[];
 }
 renderSupportMessages();
}
function renderSupportMessages(){
 const box=$("chat-messages");
 box.innerHTML=chatMessages.length?chatMessages.map(m=>'<div class="chat-bubble '+(m.sender_id===currentUser.id?'mine':'theirs')+'"><p>'+escapeHtml(m.body)+'</p><small>'+(m.sender_id===currentUser.id?'شما':(profile?.is_admin?'کاربر':'ادمین'))+' · '+jalaliDate(m.created_at,true)+'</small></div>').join(""):'<div class="empty">هنوز پیامی در این گفت‌وگو نیست. اولین پیام را ارسال کنید.</div>';
 box.scrollTop=box.scrollHeight;
}
$("chat-form").addEventListener("submit",async e=>{
 e.preventDefault();const body=$("chat-input").value.trim();if(!body||!chatTargetUserId)return;
 const btn=e.submitter;btn.disabled=true;
 try{const {error}=await db.from("support_messages").insert({user_id:chatTargetUserId,sender_id:currentUser.id,body});if(error)throw error;$("chat-input").value="";await loadSupportChat()}
 catch(err){message("chat-message",err.message,true)}finally{btn.disabled=false}
});

function navigate(page){document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));show("page-"+page,true);document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));const titles={today:"امروز","today-work":"کارهای امروز",profile:"پروفایل من",announcements:"اعلانات",contact:"ارتباط با ادمین",chat:"چت با ادمین",smart:"برنامه‌ریز هوشمند",tasks:"وظایف و تکالیف",routines:"برنامه ثابت",reports:"گزارش پیشرفت",settings:"تنظیمات",admin:"مدیریت کاربران"};if(page==="smart"&&!smartEnabled())page="today";$("page-title").textContent=titles[page]||"امروز";if(page==="admin")loadAdminUsers().catch(e=>message("admin-message",e.message,true));if(page==="chat"){chatTargetUserId=profile?.is_admin?chatTargetUserId:currentUser.id;loadSupportChat().then(startChatRealtime).catch(e=>message("chat-message",e.message,true))}else stopChatRealtime()}
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
function applyTheme(accent="emerald",appearance="dark"){document.body.dataset.theme=accent;document.body.classList.toggle("light",appearance==="light"||(appearance==="system"&&matchMedia("(prefers-color-scheme: light)").matches))}
const humorLines=["اگر تکلیف‌ها خودشان انجام می‌شدند، احتمالاً الان اینجا نبودیم!","یک قدم کوچک هم از صفر کیلومتر جلوتر است.","مغزت را روشن کن؛ حالت پرواز برای بعد از درس!","امروز با خودت رقابت کن، نه با کل دنیا.","استراحت کوتاه مجاز است؛ ناپدید شدن سه‌ساعته نه!","هر تیک، یک پیروزی کوچک است."];
function updateHumor(){const enabled=!!settings.humor_enabled;$("welcome-mood").textContent=enabled?humorLines[Math.floor(Math.random()*humorLines.length)]:"کارها را انجام بده و پیشرفتت را ثبت کن."}

async function loadAnnouncements(){const {data,error}=await db.from("announcements").select("id,title,body,created_at,created_by").eq("published",true).order("created_at",{ascending:false});if(error)throw error;window.__announcements=data||[]}
function syncProfileForm(){
 $("profile-name").value=profile?.display_name||"";
 $("profile-bio").value=profile?.bio||"";
 $("profile-avatar").value=profile?.avatar_emoji||"🌙";
 $("profile-color").value=profile?.profile_color||"violet";
 updateProfilePreview();
}
function updateProfilePreview(){
 const name=$("profile-name").value.trim()||"کاربر MMD",bio=$("profile-bio").value.trim()||"اینجا معرفی کوتاهی از خودت بنویس.",avatar=$("profile-avatar").value,color=$("profile-color").value;
 $("profile-preview-name").textContent=name;$("profile-preview-bio").textContent=bio;$("profile-preview-avatar").textContent=avatar;
 $("profile-preview").dataset.color=color;
}
["profile-name","profile-bio","profile-avatar","profile-color"].forEach(id=>$(id).addEventListener("input",updateProfilePreview));
$("profile-form").addEventListener("submit",async e=>{
 e.preventDefault();const btn=e.submitter;btn.disabled=true;message("profile-message","در حال ذخیره...");
 const display_name=$("profile-name").value.trim()||"کاربر",bio=$("profile-bio").value.trim(),avatar_emoji=$("profile-avatar").value,profile_color=$("profile-color").value;
 const {error}=await db.from("profiles").update({display_name,bio,avatar_emoji,profile_color}).eq("id",currentUser.id);
 if(error){message("profile-message",error.message,true);btn.disabled=false;return}
 profile={...profile,display_name,bio,avatar_emoji,profile_color};
 $("user-name").textContent=display_name;$("user-avatar").textContent=avatar_emoji;document.body.dataset.profileColor=profile_color;$("welcome-title").textContent="سلام "+display_name+", برنامه امروزت آماده است.";
 document.body.dataset.profileColor=profile_color;message("profile-message","پروفایل ذخیره شد.");btn.disabled=false;
});
function renderAnnouncements(){const rows=window.__announcements||[];$("announcement-list").innerHTML=rows.length?rows.map(a=>'<article class="form-panel"><div class="section-head"><h3>'+escapeHtml(a.title)+'</h3><small class="muted">'+jalaliDate(a.created_at)+'</small></div><p style="white-space:pre-wrap;line-height:2">'+escapeHtml(a.body)+'</p>'+(profile?.is_admin?'<button class="icon-btn" data-delete-announcement="'+a.id+'">حذف اطلاعیه</button>':"")+'</article>').join(""):'<div class="empty">در حال حاضر اطلاعیه‌ای منتشر نشده است.</div>'}
$("announcement-admin-form").addEventListener("submit",async e=>{e.preventDefault();const row={title:$("announcement-title").value.trim(),body:$("announcement-body").value.trim(),created_by:currentUser.id,published:true};const {error}=await db.from("announcements").insert(row);if(error){message("announcement-message",error.message,true);return}e.target.reset();await loadAnnouncements();renderAnnouncements();message("announcement-message","اطلاعیه منتشر شد.")});
document.addEventListener("click",async e=>{
 const notice=e.target.closest("[data-delete-announcement]");if(notice){if(!confirm("این اطلاعیه حذف شود؟"))return;const {error}=await db.from("announcements").delete().eq("id",notice.dataset.deleteAnnouncement);if(error)toast(error.message);else{await loadAnnouncements();renderAnnouncements()}return}
 const ban=e.target.closest("[data-ban-user]");if(ban){const u=(window.__adminUsers||[]).find(x=>x.id===ban.dataset.banUser);if(!u)return;const action=u.is_banned?"unban_user":"ban_user";if(!confirm(u.is_banned?"مسدودیت این کاربر برداشته شود؟":"این کاربر مسدود شود؟"))return;try{await callAdmin(action,{user_id:u.id});toast(u.is_banned?"مسدودیت برداشته شد.":"کاربر مسدود شد.");await loadAdminUsers()}catch(err){toast(err.message)}return}
 const remove=e.target.closest("[data-delete-user]");if(remove){const u=(window.__adminUsers||[]).find(x=>x.id===remove.dataset.deleteUser);if(!u)return;if(!confirm("حذف دائمی حساب «"+(u.display_name||u.login_id||"کاربر")+"» و تمام اطلاعات وابسته؟ این کار قابل بازگشت نیست."))return;try{await callAdmin("delete_user",{user_id:u.id});toast("حساب و اطلاعات وابسته حذف شد.");await loadAdminUsers()}catch(err){toast(err.message)}return}
 const edit=e.target.closest("[data-edit-user]");if(edit){const u=(window.__adminUsers||[]).find(x=>x.id===edit.dataset.editUser);if(!u)return;const identifier=prompt("شناسه ورود جدید:",u.login_id||"");if(identifier===null)return;const display_name=prompt("نام نمایشی:",u.display_name||"");if(display_name===null)return;const password=prompt("رمز جدید؛ برای حفظ رمز فعلی خالی بگذارید:","");if(password===null)return;try{await callAdmin("update_user",{user_id:u.id,identifier:identifier.trim(),display_name:display_name.trim(),password});toast("اطلاعات حساب به‌روزرسانی شد.");await loadAdminUsers()}catch(err){toast(err.message)}return}
});
$("admin-create-form").addEventListener("submit",async e=>{e.preventDefault();message("admin-message","در حال ساخت حساب...");try{const result=await callAdmin("create_user",{identifier:$("new-identifier").value.trim(),password:$("new-password").value,display_name:$("new-name").value.trim(),starts_at:jalaliInputToDate($("new-start").value).toISOString(),ends_at:jalaliInputToDate($("new-end").value,true).toISOString()});message("admin-message","حساب ساخته شد: "+result.identifier);e.target.reset();await loadAdminUsers()}catch(err){message("admin-message",err.message,true)}});
$("refresh-users").addEventListener("click",()=>loadAdminUsers().catch(e=>message("admin-message",e.message,true)));
async function loadAdminUsers(){if(!profile?.is_admin)return;const result=await callAdmin("list_users");window.__adminUsers=result.users||[];$("admin-users").innerHTML=window.__adminUsers.length?window.__adminUsers.map(u=>'<article class="task-item"><div class="task-main"><h3>'+escapeHtml(u.display_name||"بدون نام")+'</h3><p>شناسه: '+escapeHtml(u.login_id||u.phone||u.email||"—")+' · '+(u.ends_at?"پایان اشتراک: "+jalaliDate(u.ends_at):"بدون اشتراک")+'</p><p>'+escapeHtml(u.email||"")+'</p></div><span class="priority">'+(u.is_banned?"مسدود":u.is_active?"فعال":"غیرفعال")+'</span>'+(u.is_admin?"":'<div class="task-actions"><button class="secondary" data-renew-user="'+u.id+'">تمدید اشتراک</button><button class="secondary" data-edit-user="'+u.id+'">ویرایش حساب</button><button class="secondary" data-ban-user="'+u.id+'">'+(u.is_banned?"رفع بن":"بن کاربر")+'</button><button class="danger" data-delete-user="'+u.id+'">حذف کاربر</button></div>')+'</article>').join(""):'<div class="empty">کاربری ثبت نشده است.</div>'}
$("export-users").addEventListener("click",async()=>{const btn=$("export-users");btn.disabled=true;try{message("admin-message","در حال دریافت اطلاعات و ساخت فایل Excel...");if(!window.XLSX)throw new Error("کتابخانه Excel در دسترس نیست. اتصال اینترنت را بررسی و صفحه را تازه‌سازی کنید.");const result=await callAdmin("export_data");if(!result.data||!Object.keys(result.data).length)throw new Error("داده‌ای برای خروجی دریافت نشد.");const wb=XLSX.utils.book_new();const labels={profiles:"کاربران",subscriptions:"اشتراک‌ها",study_tasks:"وظایف و تکالیف",routines:"برنامه‌های ثابت",planner_settings:"تنظیمات برنامه‌ریزی",announcements:"اطلاعیه‌ها",support_messages:"پیام‌های پشتیبانی",auth_accounts:"حساب‌های ورود"};for(const [key,rows] of Object.entries(result.data)){const headers=(result.columns&&result.columns[key])||Object.keys((rows&&rows[0])||{});const safeRows=(rows||[]).map(row=>{const out={};for(const k of headers)out[k]=row[k]??"";return out});const sheet=XLSX.utils.json_to_sheet(safeRows,{header:headers});XLSX.utils.book_append_sheet(wb,sheet,(labels[key]||key).slice(0,31));}const bytes=XLSX.write(wb,{bookType:"xlsx",type:"array",compression:true});const blob=new Blob([bytes],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="MMD-Study-Planner-"+jalaliDate(new Date()).replaceAll("/","-")+".xlsx";document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);message("admin-message","فایل Excel ساخته شد. اگر دانلود خودکار شروع نشد، اجازه دانلود مرورگر را فعال کنید.");}catch(err){console.error("Excel export failed",err);message("admin-message","خطا در خروجی Excel: "+(err.message||"خطای نامشخص"),true)}finally{btn.disabled=false}});
boot().catch(err=>{console.error(err);show("app-view",false);show("auth-view",true);message("auth-message","خطا در راه‌اندازی: "+err.message,true)});
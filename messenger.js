/* MMD Messenger */
(()=>{
"use strict";
let tab="direct",opened=null,channel=null,createKind="group";
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fa=n=>new Intl.NumberFormat("fa-IR").format(n);
const avatar=(url,name)=>url?'<img src="'+esc(url)+'" alt="">':'<span>'+esc((name||"M").slice(0,1))+'</span>';
function toastM(s){if(typeof toast==="function")toast(s);else alert(s)}
function showLoadError(err){const msg="بارگذاری گروه‌ها و کانال‌ها ناموفق بود: "+(err?.message||err);if($("mmd-spaces-status"))$("mmd-spaces-status").textContent=msg;if($("mmd-settings-spaces-status"))$("mmd-settings-spaces-status").textContent=msg;console.error(msg,err)}
async function loadMessengerSpaces(){
 if(!currentUser)return;
 const box=$("mmd-spaces-list");if(!box)return;
 box.innerHTML='<div class="empty">در حال دریافت...</div>';
 const [sr,mr]=await Promise.all([
  db.from("messenger_spaces").select("id,name,description,space_type,visibility,avatar_url,owner_id,created_at").order("created_at",{ascending:false}),
  db.from("messenger_members").select("space_id,user_id,member_role").eq("user_id",currentUser.id)
 ]);
 if(sr.error)throw sr.error;if(mr.error)throw mr.error;
 const spaces=sr.data||[],mine=new Set((mr.data||[]).map(x=>x.space_id));
 const rows=tab==="discover"?spaces.filter(x=>x.visibility==="public"):spaces.filter(x=>x.space_type===tab&&mine.has(x.id));
 $("mmd-spaces-title").textContent=({group:"گروه‌های من",channel:"کانال‌های من",discover:"فضاهای عمومی"})[tab]||"";
 if($("mmd-spaces-status"))$("mmd-spaces-status").textContent="";if($("mmd-settings-spaces-status"))$("mmd-settings-spaces-status").textContent="";box.innerHTML=rows.length?rows.map(s=>'<article class="mmd-space-card"><div class="mmd-space-avatar">'+avatar(s.avatar_url,s.name)+'</div><div class="mmd-space-card-main"><b>'+esc(s.name)+'</b><small>'+(s.space_type==="group"?"گروه":"کانال")+' · '+(s.visibility==="public"?"عمومی":"خصوصی")+'</small><p>'+esc(s.description||"بدون توضیحات")+'</p></div><button class="secondary" type="button" data-mmd-open="'+s.id+'">'+(mine.has(s.id)?"ورود":"مشاهده")+'</button></article>').join(""):'<div class="mmd-empty"><strong>موردی پیدا نشد</strong><p>'+(tab==="discover"?"هنوز فضای عمومی ساخته نشده است.":"برای ساخت گروه یا کانال به تنظیمات برو.")+'</p></div>';
 const owned=spaces.filter(s=>s.owner_id===currentUser.id);
 $("mmd-owned-spaces").innerHTML=owned.length?'<h4>فضاهای ساخته‌شده توسط شما</h4>'+owned.map(s=>'<div class="mmd-owned-row"><span>'+esc(s.name)+' <small>'+(s.space_type==="group"?"گروه":"کانال")+'</small></span><button class="secondary" data-mmd-manage="'+s.id+'" type="button">مدیریت اعضا</button></div>').join(""):'<p class="hint">هنوز گروه یا کانالی نساخته‌ای.</p>';
}
function switchTab(t){
 tab=t;opened=null;
 document.querySelectorAll("[data-mmd-tab]").forEach(b=>b.classList.toggle("active",b.dataset.mmdTab===t));
 $("chat-content").classList.toggle("hidden",t!=="direct");
 $("mmd-spaces-panel").classList.toggle("hidden",t==="direct");
 $("mmd-space-view").classList.add("hidden");
 if(t!=="direct")loadMessengerSpaces().catch(showLoadError);
}
async function openSpace(id){
 const {data:s,error}=await db.from("messenger_spaces").select("*").eq("id",id).single();if(error)throw error;
 const {data:members,error:me}=await db.from("messenger_members").select("space_id,user_id,member_role").eq("space_id",id);if(me)throw me;
 const joined=(members||[]).some(m=>m.user_id===currentUser.id),view=$("mmd-space-view");view.classList.remove("hidden");$("mmd-spaces-panel").classList.add("space-open");
 if(!joined){
  view.innerHTML='<button class="secondary" id="mmd-space-back">← بازگشت</button><div class="mmd-space-hero"><div class="mmd-space-avatar large">'+avatar(s.avatar_url,s.name)+'</div><h3>'+esc(s.name)+'</h3><p>'+esc(s.description||"")+'</p><span>فضای عمومی</span></div><button class="primary" id="mmd-space-join">عضویت</button>';
  $("mmd-space-back").onclick=()=>{view.classList.add("hidden");$("mmd-spaces-panel").classList.remove("space-open")};
  $("mmd-space-join").onclick=async()=>{const b=$("mmd-space-join");b.disabled=true;try{const r=await db.from("messenger_members").insert({space_id:id,user_id:currentUser.id,member_role:"member"});if(r.error)throw r.error;await openSpace(id)}catch(x){toastM("عضویت ناموفق بود: "+x.message)}finally{b.disabled=false}};
  return;
 }
 opened=s;
 const ids=(members||[]).map(m=>m.user_id);
 const [pr,mr]=await Promise.all([
  db.from("public_profiles").select("id,display_name").in("id",ids),
  db.from("messenger_messages").select("*").eq("space_id",id).is("deleted_at",null).order("created_at",{ascending:true}).limit(250)
 ]);
 if(pr.error)throw pr.error;if(mr.error)throw mr.error;
 const names=new Map((pr.data||[]).map(p=>[p.id,p.display_name||"کاربر"]));
 const mine=(members||[]).find(m=>m.user_id===currentUser.id),admin=["owner","admin"].includes(mine?.member_role),canSend=s.space_type==="group"||admin;
 view.innerHTML='<div class="mmd-space-view-head"><button class="secondary" id="mmd-space-back">← فهرست</button><div class="mmd-space-avatar">'+avatar(s.avatar_url,s.name)+'</div><div><b>'+esc(s.name)+'</b><small>'+(s.space_type==="group"?"گروه":"کانال")+' · '+fa(ids.length)+' عضو</small></div><button class="secondary" id="mmd-space-info">اعضا</button></div><div class="mmd-space-messages" id="mmd-space-messages">'+((mr.data||[]).length?(mr.data||[]).map(m=>'<div class="mmd-message '+(m.sender_id===currentUser.id?"mine":"")+'"><small>'+esc(names.get(m.sender_id)||"کاربر")+'</small><p>'+esc(m.body)+'</p><time>'+new Intl.DateTimeFormat("fa-IR",{hour:"2-digit",minute:"2-digit",month:"short",day:"numeric"}).format(new Date(m.created_at))+'</time></div>').join(""):'<div class="empty">هنوز پیامی منتشر نشده است.</div>')+'</div>'+(canSend?'<form id="mmd-space-send" class="mmd-space-send"><textarea id="mmd-space-input" rows="2" maxlength="4000" required placeholder="'+(s.space_type==="channel"?"متن پست کانال...":"پیام گروه...")+'"></textarea><button class="primary">ارسال</button></form>':'<p class="hint">فقط مدیران کانال می‌توانند پست منتشر کنند.</p>')+'<div id="mmd-space-members" class="mmd-space-members hidden"></div>';
 $("mmd-space-back").onclick=()=>{opened=null;view.classList.add("hidden");$("mmd-spaces-panel").classList.remove("space-open");loadMessengerSpaces()};
 $("mmd-space-info").onclick=()=>showMembers(s,members,names,admin);
 if(canSend)$("mmd-space-send").onsubmit=async e=>{e.preventDefault();const body=$("mmd-space-input").value.trim();if(!body)return;const b=e.submitter;b.disabled=true;try{const r=await db.from("messenger_messages").insert({space_id:id,sender_id:currentUser.id,body});if(r.error)throw r.error;await openSpace(id)}catch(x){toastM("ارسال ناموفق: "+x.message)}finally{b.disabled=false}};
 $("mmd-space-messages").scrollTop=$("mmd-space-messages").scrollHeight;
 if(channel)db.removeChannel(channel);
 channel=db.channel("mmd-space-"+id).on("postgres_changes",{event:"*",schema:"public",table:"messenger_messages",filter:"space_id=eq."+id},()=>{if(opened?.id===id)openSpace(id).catch(console.warn)}).subscribe();
}
function showMembers(s,members,names,admin){
 const box=$("mmd-space-members");box.classList.toggle("hidden");if(box.classList.contains("hidden"))return;
 box.innerHTML='<h4>اعضای '+esc(s.name)+'</h4>'+(members||[]).map(m=>'<div class="mmd-member-row"><span>'+esc(names.get(m.user_id)||"کاربر")+'</span><small>'+({owner:"سازنده",admin:"مدیر",member:"عضو"}[m.member_role]||"عضو")+'</small></div>').join("")+(admin?'<form id="mmd-invite-form" class="mmd-invite-form"><label>دعوت عضو<select id="mmd-invite-user"><option value="">انتخاب کاربر</option></select></label><button class="secondary">افزودن عضو</button></form>':"");
 if(admin){
  const sel=$("mmd-invite-user");
  db.from("public_profiles").select("id,display_name").order("display_name").then(({data,error})=>{if(!error)sel.innerHTML='<option value="">انتخاب کاربر</option>'+(data||[]).filter(p=>!members.some(m=>m.user_id===p.id)).map(p=>'<option value="'+p.id+'">'+esc(p.display_name||"کاربر")+'</option>').join("")});
  $("mmd-invite-form").onsubmit=async e=>{e.preventDefault();if(!sel.value)return;const r=await db.from("messenger_members").insert({space_id:s.id,user_id:sel.value,member_role:"member"});if(r.error){toastM("دعوت انجام نشد: "+r.error.message);return}toastM("عضو اضافه شد.");openSpace(s.id)};
 }
}
function showCreate(kind){
 createKind=kind;$("mmd-space-modal-title").textContent=kind==="group"?"ایجاد گروه جدید":"ایجاد کانال جدید";$("mmd-space-submit").textContent=kind==="group"?"ساخت گروه":"ساخت کانال";$("mmd-space-form").reset();$("mmd-avatar-preview").textContent="تصویر انتخاب نشده";$("mmd-space-form-message").textContent="";$("mmd-space-modal").classList.remove("hidden");
}
async function createSpace(e){
 e.preventDefault();const name=$("mmd-space-name").value.trim(),file=$("mmd-space-avatar").files[0],btn=$("mmd-space-submit");if(name.length<2)return;btn.disabled=true;
 try{
  let avatar_url=null;
  if(file){if(file.size>5*1024*1024)throw Error("تصویر باید کمتر از ۵ مگابایت باشد.");const ext=(file.name.split(".").pop()||"jpg").toLowerCase(),path=currentUser.id+"/"+crypto.randomUUID()+"."+ext;const up=await db.storage.from("messenger-avatars").upload(path,file,{contentType:file.type});if(up.error)throw up.error;avatar_url=db.storage.from("messenger-avatars").getPublicUrl(path).data.publicUrl;}
  const {data:s,error}=await db.from("messenger_spaces").insert({name,description:$("mmd-space-description").value.trim(),space_type:createKind,visibility:$("mmd-space-visibility").value,avatar_url,owner_id:currentUser.id}).select().single();if(error)throw error;
  const m=await db.from("messenger_members").insert({space_id:s.id,user_id:currentUser.id,member_role:"owner"});if(m.error)throw m.error;
  $("mmd-space-modal").classList.add("hidden");toastM(createKind==="group"?"گروه ساخته شد.":"کانال ساخته شد.");switchTab(createKind);await loadMessengerSpaces();await openSpace(s.id);
 }catch(x){$("mmd-space-form-message").textContent="خطا: "+x.message}finally{btn.disabled=false}
}
function bind(){
 document.querySelectorAll("[data-mmd-tab]").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.mmdTab)));
 document.querySelectorAll("[data-mmd-create]").forEach(b=>b.addEventListener("click",()=>showCreate(b.dataset.mmdCreate)));
 $("mmd-space-form")?.addEventListener("submit",createSpace);
 $("mmd-space-modal-close")?.addEventListener("click",()=>$("mmd-space-modal").classList.add("hidden"));
 $("mmd-space-modal")?.addEventListener("click",e=>{if(e.target===$("mmd-space-modal"))$("mmd-space-modal").classList.add("hidden")});
 $("mmd-space-avatar")?.addEventListener("change",e=>{const f=e.target.files[0];$("mmd-avatar-preview").innerHTML=f?'<img src="'+URL.createObjectURL(f)+'" alt="پیش‌نمایش">':"تصویر انتخاب نشده"});
 $("mmd-spaces-refresh")?.addEventListener("click",()=>loadMessengerSpaces().catch(showLoadError));
 $("mmd-spaces-list")?.addEventListener("click",e=>{const b=e.target.closest("[data-mmd-open]");if(b)openSpace(b.dataset.mmdOpen).catch(x=>{toastM("خطا: "+x.message);showLoadError(x)})});
 $("mmd-owned-spaces")?.addEventListener("click",e=>{const b=e.target.closest("[data-mmd-manage]");if(b){if(typeof navigate==="function")navigate("chat");switchTab("discover");openSpace(b.dataset.mmdManage).catch(x=>{toastM(x.message);showLoadError(x)})}});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
window.loadMessengerSpaces=()=>loadMessengerSpaces().catch(showLoadError);
})();
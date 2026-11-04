/* MMD Study Planner — editable entries + automatic replanning */
(() => {
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const localInput = value => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = n => String(n).padStart(2,"0");
    return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T"+pad(d.getHours())+":"+pad(d.getMinutes());
  };
  function closeEditor(){ document.getElementById("mmd-edit-overlay")?.remove(); }
  function openEditor(html){
    closeEditor();
    const wrap=document.createElement("div");
    wrap.id="mmd-edit-overlay";
    wrap.style.cssText="position:fixed;inset:0;z-index:100000;background:#06101dcc;display:grid;place-items:center;padding:16px;overflow:auto";
    wrap.innerHTML='<form id="mmd-edit-form" style="width:min(560px,100%);max-height:90vh;overflow:auto;background:var(--panel,#fff);color:var(--text,#172033);border:1px solid var(--border,#ccd3df);border-radius:20px;padding:22px;box-shadow:0 24px 80px #0006;display:grid;gap:13px">'+html+'<div style="display:flex;gap:10px;justify-content:flex-end;position:sticky;bottom:-22px;background:var(--panel,#fff);padding:12px 0 0"><button type="button" id="mmd-edit-cancel" class="secondary">انصراف</button><button type="submit" id="mmd-edit-submit" class="primary">ذخیره و بازچینی برنامه</button></div><p id="mmd-edit-message" class="message" role="status"></p></form>';
    wrap.addEventListener("click",e=>{if(e.target===wrap)closeEditor()});
    document.body.append(wrap);
    $("mmd-edit-cancel").addEventListener("click",closeEditor);
    return $("mmd-edit-form");
  }
  const field=(label,id,value,type="text",attrs="")=>'<label style="display:grid;gap:6px">'+label+'<input id="'+id+'" type="'+type+'" value="'+esc(value)+'" '+attrs+' style="width:100%;box-sizing:border-box"></label>';
  function addEditButtons(){
    document.querySelectorAll("#all-tasks .task-item,#today-tasks .task-item,#daily-task-list .task-item").forEach(card=>{
      const del=card.querySelector("[data-task-delete]");
      if(!del||card.querySelector("[data-task-edit]"))return;
      const b=document.createElement("button");b.type="button";b.className="secondary";b.textContent="ویرایش";b.dataset.taskEdit=del.dataset.taskDelete;del.parentElement?.insertBefore(b,del);
    });
    document.querySelectorAll("#routine-list .routine-card").forEach(card=>{
      const del=card.querySelector("[data-routine-delete]");
      if(!del||card.querySelector("[data-routine-edit]"))return;
      const b=document.createElement("button");b.type="button";b.className="secondary";b.textContent="ویرایش";b.dataset.routineEdit=del.dataset.routineDelete;del.parentElement?.insertBefore(b,del);
    });
  }
  const observer=new MutationObserver(addEditButtons);
  function start(){
    ["all-tasks","today-tasks","daily-task-list","routine-list"].forEach(id=>{const el=$(id);if(el)observer.observe(el,{childList:true,subtree:true})});
    addEditButtons();
  }
  async function editTask(id){
    const task=tasks.find(t=>String(t.id)===String(id));if(!task)return;
    const form=openEditor('<h2 style="margin:0">ویرایش وظیفه</h2>'+field("عنوان وظیفه","mmd-e-title",task.title)+field("توضیحات","mmd-e-description",task.description||"")+field("مدت‌زمان موردنیاز (دقیقه)","mmd-e-minutes",task.estimated_minutes,"number",'min="5" max="1440" step="5" required')+field("مهلت تحویل","mmd-e-due",localInput(task.due_at),"datetime-local")+'<label style="display:grid;gap:6px">اولویت<select id="mmd-e-priority"><option value="low">کم</option><option value="normal">معمولی</option><option value="high">زیاد</option></select></label><label style="display:grid;gap:6px">وضعیت<select id="mmd-e-status"><option value="pending">در انتظار</option><option value="done">انجام‌شده</option><option value="cancelled">لغوشده</option></select></label>');
    $("mmd-e-priority").value=task.priority||"normal";$("mmd-e-status").value=task.status||"pending";
    form.addEventListener("submit",async e=>{
      e.preventDefault();const btn=$("mmd-edit-submit");btn.disabled=true;
      try{
        const minutes=Number($("mmd-e-minutes").value);
        if(!Number.isInteger(minutes)||minutes<5||minutes>1440)throw new Error("مدت‌زمان باید بین ۵ تا ۱۴۴۰ دقیقه باشد.");
        const dueValue=$("mmd-e-due").value;
        const dueAt=dueValue?new Date(dueValue).toISOString():null;
        const patch={title:$("mmd-e-title").value.trim(),description:$("mmd-e-description").value.trim(),estimated_minutes:minutes,due_at:dueAt,priority:$("mmd-e-priority").value,status:$("mmd-e-status").value,schedule_locked:false};
        if(!patch.title)throw new Error("عنوان وظیفه را وارد کنید.");
        const {error}=await db.from("study_tasks").update(patch).eq("id",task.id).eq("user_id",currentUser.id);
        if(error)throw error;
        Object.assign(task,patch);
        weeklyPlan=weeklyPlan.filter(p=>String(p.task_id)!==String(task.id));
        await savePlannerData();
        await refreshTasks();
        await generateWeeklyPlan(true);
        renderProgramsHub();closeEditor();toast("وظیفه ویرایش شد و برنامه بر اساس تغییرات دوباره چیده شد.");
      }catch(err){$("mmd-edit-message").textContent=err.message||"ذخیره انجام نشد.";btn.disabled=false}
    });
  }
  async function editRoutine(id){
    const item=routines.find(r=>String(r.id)===String(id));if(!item)return;
    const form=openEditor('<h2 style="margin:0">ویرایش برنامه ثابت</h2>'+field("عنوان برنامه","mmd-r-title",item.title)+field("توضیحات","mmd-r-details",item.details||"")+'<label style="display:grid;gap:6px">روز هفته<select id="mmd-r-day">'+["یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه","شنبه"].map((n,i)=>'<option value="'+i+'">'+n+'</option>').join("")+'</select></label>'+field("ساعت","mmd-r-time",(item.scheduled_time||"").slice(0,5),"time"));
    $("mmd-r-day").value=String(item.weekday);
    form.addEventListener("submit",async e=>{
      e.preventDefault();const btn=$("mmd-edit-submit");btn.disabled=true;
      try{
        const patch={title:$("mmd-r-title").value.trim(),details:$("mmd-r-details").value.trim(),weekday:Number($("mmd-r-day").value),scheduled_time:$("mmd-r-time").value||null};
        if(!patch.title)throw new Error("عنوان برنامه را وارد کنید.");
        const {error}=await db.from("routines").update(patch).eq("id",item.id).eq("user_id",currentUser.id);
        if(error)throw error;
        Object.assign(item,patch);await loadRoutines();renderRoutines();renderTodayWork();await generateWeeklyPlan(true);
        renderProgramsHub();closeEditor();toast("برنامه ثابت ویرایش شد و برنامه هفتگی دوباره بررسی شد.");
      }catch(err){$("mmd-edit-message").textContent=err.message||"ذخیره انجام نشد.";btn.disabled=false}
    });
  }

  const dayNames=["یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه","شنبه"];
  function renderProgramsHub(){
    const host=$("programs-hub-list");if(!host)return;
    const taskCards=tasks.map(t=>'<article class="task-item"><div class="task-main"><h3>'+esc(t.title)+'</h3><p>وظیفه و تکلیف · مهلت: '+esc(t.due_at?jalaliDate(t.due_at,true):"بدون مهلت")+' · مدت: '+esc(t.estimated_minutes||"—")+' دقیقه</p></div><span class="priority">'+(t.status==="done"?"انجام‌شده":t.status==="cancelled"?"لغوشده":"در انتظار")+'</span><div class="task-actions"><button class="secondary" type="button" data-task-edit="'+esc(t.id)+'">ویرایش</button></div></article>').join("");
    const routineCards=routines.map(r=>'<article class="routine-card"><b>'+esc(r.title)+'</b><small>برنامه ثابت · '+esc(dayNames[Number(r.weekday)]||"")+' · '+esc((r.scheduled_time||"").slice(0,5)||"بدون ساعت")+'</small><p class="muted">'+esc(r.details||"")+'</p><button class="secondary" type="button" data-routine-edit="'+esc(r.id)+'">ویرایش</button></article>').join("");
    const planCards=weeklyPlan.map(p=>{
      const t=tasks.find(x=>String(x.id)===String(p.task_id));if(!t)return "";
      const start=new Date(p.start);
      const time=Number.isNaN(start.getTime())?"":String(start.getHours()).padStart(2,"0")+":"+String(start.getMinutes()).padStart(2,"0");
      return '<article class="task-item"><div class="task-main"><h3>'+esc(t.title)+'</h3><p>زمان‌بندی هفتگی · '+esc(p.date)+' · '+esc(time)+' · '+esc(p.duration)+' دقیقه</p></div><div class="task-actions"><button class="secondary" type="button" data-plan-edit="'+esc(p.id||p.task_id)+'" data-plan-date="'+esc(p.date)+'" data-plan-time="'+esc(time)+'">ویرایش زمان</button><button class="secondary" type="button" data-task-edit="'+esc(t.id)+'">ویرایش تکلیف</button></div></article>';
    }).join("");
    host.innerHTML='<section class="form-panel"><div class="section-head"><div><h3>وظایف و تکالیف</h3><p class="muted">ویرایش عنوان، توضیحات، مهلت، اولویت، وضعیت و مدت‌زمان</p></div><b>'+fa(tasks.length)+'</b></div>'+ (taskCards||'<p class="empty">تکلیفی ثبت نشده است.</p>')+'</section><section class="form-panel"><div class="section-head"><div><h3>برنامه‌های ثابت</h3><p class="muted">ویرایش روز، ساعت و توضیحات برنامه</p></div><b>'+fa(routines.length)+'</b></div>'+ (routineCards||'<p class="empty">برنامه ثابتی ثبت نشده است.</p>')+'</section><section class="form-panel"><div class="section-head"><div><h3>زمان‌بندی هفتگی</h3><p class="muted">ویرایش ساعت یا روز هر بخش؛ پس از ذخیره، تداخل‌ها بررسی می‌شوند.</p></div><b>'+fa(weeklyPlan.length)+'</b></div>'+ (planCards||'<p class="empty">هنوز برنامه هفتگی ساخته نشده است.</p>')+'</section>';
  }
  async function editPlanTime(id,date,time){
    const form=openEditor('<h2 style="margin:0">ویرایش زمان‌بندی</h2>'+field("تاریخ","mmd-p-date",date,"date",'required')+field("ساعت شروع","mmd-p-time",time,"time",'required'));
    form.addEventListener("submit",async e=>{
      e.preventDefault();const btn=$("mmd-edit-submit");btn.disabled=true;
      try{
        const d=$("mmd-p-date").value,tm=$("mmd-p-time").value;
        if(!d||!tm)throw new Error("تاریخ و ساعت را کامل وارد کن.");
        await movePlannerTask(id,d,tm);
        renderProgramsHub();closeEditor();
      }catch(err){$("mmd-edit-message").textContent=err.message||"تغییر زمان انجام نشد.";btn.disabled=false}
    });
  }

  document.addEventListener("click",e=>{
    const p=e.target.closest("[data-plan-edit]");if(p){editPlanTime(p.dataset.planEdit,p.dataset.planDate,p.dataset.planTime);return}
    const t=e.target.closest("[data-task-edit]");if(t){editTask(t.dataset.taskEdit);return}
    const r=e.target.closest("[data-routine-edit]");if(r){editRoutine(r.dataset.routineEdit);return}
  });
  document.addEventListener("click",e=>{if(e.target.closest('[data-page="programs"]'))renderProgramsHub();if(e.target.closest("#programs-refresh"))renderProgramsHub();});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
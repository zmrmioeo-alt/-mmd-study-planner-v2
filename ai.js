(() => {
  "use strict";
  let activeId = null, conversations = [], messages = [], busy = false, loadedUserId = null;
  const $ai = id => document.getElementById(id);
  const faNum = n => Number(n || 0).toLocaleString("fa-IR");
  const esc = s => String(s || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function formatText(value) {
    let s = esc(value);
    s = s.replace(/\x60\x60\x60([\s\S]*?)\x60\x60\x60/g, "<pre><code>$1</code></pre>");
    s = s.replace(/\x60([^\x60\n]+)\x60/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
    s = s.replace(/^### (.*)$/gm, "<h4>$1</h4>").replace(/^## (.*)$/gm, "<h3>$1</h3>");
    return s.replace(/\n/g, "<br>");
  }
  function setStatus(text, error) {
    const el = $ai("ai-status"); if (!el) return;
    el.textContent = text || ""; el.classList.toggle("is-error", !!error);
  }
  function renderQuota(q) {
    if (!q) return;
    const remaining = Number(q.remaining || 0), limit = Number(q.limit || 0);
    const used = Number(q.used ?? (limit - remaining));
    const label = $ai("ai-quota-label"), bar = $ai("ai-quota-fill");
    if (label) label.textContent = faNum(remaining) + " پیام از " + faNum(limit) + " پیام امروز باقی مانده";
    if (bar) bar.style.width = (limit ? Math.max(0, Math.min(100, used / limit * 100)) : 0) + "%";
  }
  async function loadQuota() {
    const {data,error} = await db.rpc("get_ai_quota");
    if (error) { setStatus("دریافت سهمیه ممکن نشد.", true); return; }
    renderQuota(data);
  }
  function renderConversationList() {
    const list = $ai("ai-history-list"); if (!list) return;
    if (!conversations.length) { list.innerHTML = '<div class="ai-history-empty">هنوز گفت‌وگویی نداری.</div>'; return; }
    list.innerHTML = conversations.map(c =>
      '<div class="ai-history-item ' + (c.id === activeId ? "active" : "") + '" data-ai-open="' + c.id + '">' +
      '<button class="ai-history-title" type="button" data-ai-open="' + c.id + '" title="' + esc(c.title) + '">' + esc(c.title) + '</button>' +
      '<button class="ai-history-menu" type="button" data-ai-menu="' + c.id + '" aria-label="مدیریت گفت‌وگو">⋯</button></div>'
    ).join("");
  }
  function renderMessages() {
    const list = $ai("ai-messages"), welcome = $ai("ai-welcome"); if (!list) return;
    if (!messages.length) { list.innerHTML = ""; if (welcome) welcome.classList.remove("hidden"); return; }
    if (welcome) welcome.classList.add("hidden");
    list.innerHTML = messages.map(m =>
      '<article class="ai-message ' + (m.role === "user" ? "from-user" : "from-ai") + '">' +
      '<div class="ai-message-avatar">' + (m.role === "user" ? "شما" : "AI") + '</div>' +
      '<div class="ai-message-content">' + formatText(m.content) + '</div>' +
      '<button class="ai-copy-message" type="button" data-ai-copy="' + encodeURIComponent(m.content) + '" aria-label="کپی پاسخ">کپی</button></article>'
    ).join("");
    list.scrollTop = list.scrollHeight;
  }
  async function loadConversations() {
    if (!currentUser) return;
    const {data,error} = await db.from("ai_conversations").select("id,title,updated_at")
      .eq("user_id", currentUser.id).order("updated_at", {ascending:false}).limit(60);
    if (error) throw error;
    conversations = data || []; renderConversationList();
  }
  async function openConversation(id) {
    if (!currentUser) return;
    activeId = id; messages = []; renderConversationList(); renderMessages();
    const {data,error} = await db.from("ai_messages").select("id,role,content,created_at")
      .eq("conversation_id", id).eq("user_id", currentUser.id)
      .order("created_at", {ascending:true}).limit(100);
    if (error) throw error;
    messages = data || []; renderMessages(); setStatus("");
  }
  function newConversation() {
    activeId = null; messages = []; renderConversationList(); renderMessages();
    setStatus("گفت‌وگوی تازه آماده است."); $ai("ai-prompt")?.focus();
  }
  async function refreshAll() {
    if (!currentUser) return;
    if (loadedUserId !== currentUser.id) {
      activeId = null; messages = []; loadedUserId = currentUser.id;
      const consent = localStorage.getItem("mmd_ai_privacy_accepted_" + currentUser.id) === "yes";
      if ($ai("ai-privacy-check")) $ai("ai-privacy-check").checked = consent;
    }
    await Promise.all([loadConversations(), loadQuota()]);
    if (activeId && conversations.some(c => c.id === activeId)) await openConversation(activeId);
    else if (conversations.length) await openConversation(conversations[0].id);
    else newConversation();
  }
  async function sendMessage() {
    if (busy || !currentUser) return;
    const prompt = $ai("ai-prompt"), message = (prompt?.value || "").trim();
    if (!message) return;
    if (message.length > 6000) { setStatus("پیام بیش از ۶۰۰۰ نویسه است.", true); return; }
    const consent = $ai("ai-privacy-check");
    if (!consent?.checked) { setStatus("برای ارسال پیام، ابتدا اطلاعیه حریم خصوصی را تأیید کن.", true); consent?.focus(); return; }
    localStorage.setItem("mmd_ai_privacy_accepted_" + currentUser.id, "yes");
    busy = true; const send = $ai("ai-send"); if (send) send.disabled = true;
    prompt.value = ""; prompt.style.height = "auto"; setStatus("در حال دریافت پاسخ...");
    messages.push({role:"user",content:message}); renderMessages();
    const pending = document.createElement("article");
    pending.className = "ai-message from-ai ai-pending";
    pending.innerHTML = '<div class="ai-message-avatar">AI</div><div class="ai-message-content"><span class="ai-dots"><i></i><i></i><i></i></span></div>';
    $ai("ai-messages")?.appendChild(pending); $ai("ai-messages").scrollTop = $ai("ai-messages").scrollHeight;
    try {
      if (!activeId) {
        const title = message.replace(/\s+/g, " ").slice(0,54) || "گفت‌وگوی جدید";
        const {data:created,error:createError} = await db.from("ai_conversations")
          .insert({user_id:currentUser.id,title}).select("id").single();
        if (createError) throw createError;
        activeId = created.id;
      }
      const {data,error} = await db.functions.invoke("mmd-ai", {body:{conversationId:activeId,message}});
      if (error) {
        let details = null; try { details = await error.context?.json?.(); } catch (_) {}
        await loadQuota().catch(() => {});
        throw new Error(details?.error || error.message || "ارسال پیام ناموفق بود.");
      }
      if (!data?.reply) throw new Error(data?.error || "پاسخی دریافت نشد.");
      messages.push({role:"assistant",content:data.reply}); renderMessages();
      renderQuota(data.quota); await loadConversations(); setStatus("پاسخ آماده است.");
    } catch (error) {
      messages.pop(); renderMessages(); setStatus(error.message || "خطا در ارتباط با هوش مصنوعی.", true);
    } finally {
      pending.remove(); busy = false; if (send) send.disabled = false; prompt?.focus();
    }
  }
  async function manageConversation(id) {
    const c = conversations.find(x => x.id === id); if (!c) return;
    const choice = window.prompt("برای تغییر نام، نام جدید را بنویس؛ برای حذف، بنویس: حذف");
    if (choice === null) return;
    if (choice.trim() === "حذف") {
      if (!confirm("این گفت‌وگو و پیام‌های آن حذف شود؟")) return;
      const {error} = await db.from("ai_conversations").delete().eq("id",id).eq("user_id",currentUser.id);
      if (error) throw error;
      if (activeId === id) { activeId = null; messages = []; }
    } else if (choice.trim()) {
      const {error} = await db.from("ai_conversations").update({title:choice.trim().slice(0,100)})
        .eq("id",id).eq("user_id",currentUser.id);
      if (error) throw error;
    }
    await loadConversations();
    if (!activeId && conversations.length) await openConversation(conversations[0].id);
    else if (!conversations.length) newConversation();
  }
  document.addEventListener("click", async event => {
    if (event.target.closest('[data-page="ai"]')) { setTimeout(() => refreshAll().catch(e => setStatus(e.message,true)), 0); return; }
    if (event.target.closest("#ai-new-chat")) { newConversation(); return; }
    const menu = event.target.closest("[data-ai-menu]");
    if (menu) { event.stopPropagation(); try { await manageConversation(menu.dataset.aiMenu); } catch(e) { setStatus(e.message,true); } return; }
    const open = event.target.closest("[data-ai-open]");
    if (open) { try { await openConversation(open.dataset.aiOpen); } catch(e) { setStatus(e.message,true); } return; }
    const copy = event.target.closest("[data-ai-copy]");
    if (copy) {
      try { await navigator.clipboard.writeText(decodeURIComponent(copy.dataset.aiCopy)); setStatus("پاسخ کپی شد."); }
      catch (_) { setStatus("کپی خودکار در این مرورگر در دسترس نیست.",true); }
    }
  });
  document.addEventListener("submit", event => {
    if (event.target?.id === "ai-composer") { event.preventDefault(); sendMessage(); }
  });
  document.addEventListener("keydown", event => {
    if (event.target?.id === "ai-prompt" && event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); }
  });
  document.addEventListener("input", event => {
    if (event.target?.id === "ai-prompt") { event.target.style.height = "auto"; event.target.style.height = Math.min(event.target.scrollHeight,180) + "px"; }
  });
  document.addEventListener("change", event => {
    if (event.target?.id === "ai-privacy-check" && event.target.checked && currentUser) {
      localStorage.setItem("mmd_ai_privacy_accepted_" + currentUser.id,"yes"); setStatus("");
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && $ai("page-ai")?.classList.contains("hidden") === false) loadQuota().catch(() => {});
  });
})();
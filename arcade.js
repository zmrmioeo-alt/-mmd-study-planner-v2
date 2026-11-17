/* UPLAND ARCADE EXTRA GAMES — Snake + online reaction duel */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const fa=n=>Number(n||0).toLocaleString("fa-IR");
const accountKey=()=>{try{return typeof currentUser!=="undefined"&&currentUser?.id?currentUser.id:"guest"}catch(_){return "guest"}};
const playerName=()=>{try{return (typeof profile!=="undefined"&&profile?.display_name)||(typeof currentUser!=="undefined"&&(currentUser?.user_metadata?.full_name||currentUser?.email?.split("@")[0]))||"بازیکن"}catch(_){return "بازیکن"}};

/* SNAKE */
(()=>{
 const canvas=$("snake-canvas");if(!canvas)return;
 const ctx=canvas.getContext("2d"),size=18,cols=20,rows=20;
 const bestKey="upland_snake_best_v1_"+accountKey();
 let snake=[],food={x:10,y:10},dir={x:1,y:0},nextDir={x:1,y:0},timer=null,score=0,best=Number(localStorage.getItem(bestKey)||0),running=false,over=false,speed=135;
 const scoreEl=$("snake-score"),bestEl=$("snake-best"),msg=$("snake-message"),start=$("snake-start"),pause=$("snake-pause");
 const say=t=>{if(msg)msg.textContent=t};
 function updateHud(){if(scoreEl)scoreEl.textContent=fa(score);if(bestEl)bestEl.textContent=fa(best);if(start)start.textContent=over?"شروع دوباره":running?"در حال بازی":"شروع بازی";if(pause)pause.disabled=!running}
 function placeFood(){let p;do{p={x:Math.floor(Math.random()*cols),y:Math.floor(Math.random()*rows)}}while(snake.some(s=>s.x===p.x&&s.y===p.y));food=p}
 function rounded(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
 function draw(){
  const w=canvas.width,h=canvas.height,cell=w/cols;ctx.clearRect(0,0,w,h);
  const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,"#071b36");bg.addColorStop(1,"#102d4d");ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  ctx.strokeStyle="rgba(177,215,255,.07)";ctx.lineWidth=1;for(let i=0;i<=cols;i++){ctx.beginPath();ctx.moveTo(i*cell,0);ctx.lineTo(i*cell,h);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*cell);ctx.lineTo(w,i*cell);ctx.stroke()}
  ctx.shadowColor="#ff7c8d";ctx.shadowBlur=16;ctx.fillStyle="#ff7188";ctx.beginPath();ctx.arc((food.x+.5)*cell,(food.y+.5)*cell,cell*.34,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  snake.forEach((s,i)=>{ctx.fillStyle=i===0?"#a4f5df":"#38c7b5";rounded(s.x*cell+1.5,s.y*cell+1.5,cell-3,cell-3,5);if(i===0){ctx.fillStyle="#092b3b";const ex=(s.x+.5+dir.x*.18)*cell,ey=(s.y+.5+dir.y*.18)*cell;ctx.beginPath();ctx.arc(ex-dir.y*3,ey+dir.x*3,2.1,0,Math.PI*2);ctx.arc(ex+dir.y*3,ey-dir.x*3,2.1,0,Math.PI*2);ctx.fill()}});
  if(!running&&!over&&snake.length===0){ctx.fillStyle="rgba(255,255,255,.8)";ctx.font="bold 18px sans-serif";ctx.textAlign="center";ctx.fillText("برای شروع آماده‌ای؟",w/2,h/2)}
  if(over){ctx.fillStyle="rgba(2,10,25,.58)";ctx.fillRect(0,0,w,h);ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="bold 25px sans-serif";ctx.fillText("پایان بازی",w/2,h/2-8);ctx.font="15px sans-serif";ctx.fillText("امتیاز: "+fa(score),w/2,h/2+22)}
 }
 function stop(){running=false;if(timer)clearInterval(timer);timer=null;updateHud()}
 function end(){stop();over=true;if(score>best){best=score;localStorage.setItem(bestKey,String(best));say("رکورد جدید ثبت شد: "+fa(score)+" امتیاز!")}else say("برخورد کردی؛ امتیاز این دور: "+fa(score));if(score>0&&window.saveUplandGameRecord)window.saveUplandGameRecord("snake",score).catch(e=>say("ثبت رکورد آنلاین ناموفق بود: "+e.message));updateHud();draw()}
 function tick(){
  dir=nextDir;const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
  const eating=head.x===food.x&&head.y===food.y;
  if(head.x<0||head.y<0||head.x>=cols||head.y>=rows||snake.slice(0,eating?snake.length:snake.length-1).some(s=>s.x===head.x&&s.y===head.y)){end();return}
  snake.unshift(head);if(eating){score+=10;placeFood();const nextSpeed=Math.max(65,135-Math.floor(score/50)*7);if(nextSpeed!==speed){speed=nextSpeed;clearInterval(timer);timer=setInterval(tick,speed)}}else snake.pop();
  updateHud();draw()
 }
 function startGame(){stop();snake=[{x:5,y:10},{x:4,y:10},{x:3,y:10}];dir={x:1,y:0};nextDir={x:1,y:0};score=0;speed=135;over=false;placeFood();running=true;timer=setInterval(tick,speed);say("حرکت کن و نقطه‌ها را جمع کن؛ به دیوار و خودت برخورد نکن.");updateHud();draw()}
 function change(x,y){if(!running)return;if(x===-dir.x&&y===-dir.y)return;nextDir={x,y}}
 $("snake-start")?.addEventListener("click",startGame);
 $("snake-pause")?.addEventListener("click",()=>{if(!running)return;stop();say("بازی متوقف شد؛ برای ادامه شروع بازی را بزن.");draw()});
 document.querySelectorAll("[data-snake-dir]").forEach(b=>b.addEventListener("click",()=>{const d=b.dataset.snakeDir;change(d==="up"?0:-0,d==="up"?-1:d==="down"?1:d==="left"?0:0);if(d==="left")change(-1,0);if(d==="right")change(1,0)}));
 document.addEventListener("keydown",e=>{if(!$("page-games")||$("page-games").classList.contains("hidden"))return;const map={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],KeyW:[0,-1],KeyS:[0,1],KeyA:[-1,0],KeyD:[1,0]};if(map[e.code]){e.preventDefault();change(...map[e.code])}});
 let touch=null;canvas.addEventListener("pointerdown",e=>{touch={x:e.clientX,y:e.clientY}});
 canvas.addEventListener("pointerup",e=>{if(!touch)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;touch=null;if(Math.max(Math.abs(dx),Math.abs(dy))<18)return;if(Math.abs(dx)>Math.abs(dy))change(dx>0?1:-1,0);else change(0,dy>0?1:-1)});
 updateHud();draw();
})();

/* ONLINE TWO-PLAYER REACTION DUEL */
(()=>{
 const create=$("duel-create"),join=$("duel-join"),codeInput=$("duel-code"),leave=$("duel-leave"),hit=$("duel-hit"),status=$("duel-status"),room=$("duel-room"),roundEl=$("duel-round"),players=$("duel-players"),result=$("duel-result");
 if(!create||!join||!hit)return;
 let channel=null,role=null,code="",id="p-"+Math.random().toString(36).slice(2,10),name=playerName(),opponent=null,round=0,goAt=0,active=false,hostHits={},totals={},roundTimer=null,waitTimer=null,finished=false;
 const say=t=>{status.textContent=t},paintPlayers=()=>{players.textContent=name+(opponent?"  مقابل  "+opponent.name:"  ·  منتظر بازیکن دوم")};
 const send=(event,payload)=>{if(channel)channel.send({type:"broadcast",event,payload})};
 function clearTimers(){if(roundTimer)clearTimeout(roundTimer);if(waitTimer)clearTimeout(waitTimer);roundTimer=waitTimer=null}
 function resetState(){clearTimers();active=false;round=0;goAt=0;opponent=null;hostHits={};totals={};finished=false;result.textContent="";roundEl.textContent="—";hit.disabled=true;paintPlayers()}
 function showRoom(){room.textContent=code;room.classList.remove("hidden");leave.classList.remove("hidden")}
 function beginLocalRound(payload){round=payload.round;goAt=payload.goAt;active=false;roundEl.textContent=fa(round)+" / ۵";hit.disabled=true;result.textContent="آماده شو…";say("وقتی پیام «الان!» ظاهر شد، سریع دکمه را بزن.");const wait=Math.max(0,goAt-Date.now());if(roundTimer)clearTimeout(roundTimer);roundTimer=setTimeout(()=>{if(finished)return;active=true;hit.disabled=false;result.textContent="الان!";say("همین حالا دکمه را بزن!")},wait)}
 function renderScores(data){const mine=data[id]??"—",other=opponent?(data[opponent.id]??"—"):"—";result.textContent="دور "+fa(round)+" · "+name+": "+(mine==="—"?"—":fa(mine)+" ms")+" | "+(opponent?.name||"حریف")+": "+(other==="—"?"—":fa(other)+" ms");}
 function settleRound(){if(role!=="host"||finished)return;const ids=[id,opponent?.id].filter(Boolean);if(ids.length<2)return;if(!ids.every(pid=>Object.prototype.hasOwnProperty.call(hostHits,pid)))return;clearTimers();const r={round,values:{...hostHits}};ids.forEach(pid=>totals[pid]=(totals[pid]||0)+hostHits[pid]);send("round-result",{round,values:r.values,totals:{...totals},names:{[id]:name,[opponent.id]:opponent.name}});renderScores(r.values);active=false;hit.disabled=true;if(round>=5){finishMatch();return}waitTimer=setTimeout(startRound,2300)}
 function persistDuelRecord(payload){const total=Number(payload?.totals?.[id]||0);const average=Math.round(total/5);if(average>0&&window.saveUplandGameRecord)window.saveUplandGameRecord("duel-speed",average).catch(e=>say("ثبت رکورد دوئل ناموفق بود: "+e.message))}
 function finishMatch(){if(role!=="host"||finished)return;finished=true;clearTimers();const mine=totals[id]||0,other=totals[opponent.id]||0;const winner=mine===other?"مساوی":mine<other?name:opponent.name;const payload={totals:{...totals},names:{[id]:name,[opponent.id]:opponent.name},winner};send("match-end",payload);showWinner(payload);persistDuelRecord(payload)}
 function showWinner(p){finished=true;active=false;hit.disabled=true;clearTimers();const mine=p.totals[id]||0,other=opponent?(p.totals[opponent.id]||0):0;result.textContent="نتیجه نهایی — "+name+": "+fa(mine)+" ms | "+(opponent?.name||"حریف")+": "+fa(other)+" ms";say(p.winner==="مساوی"?"بازی مساوی شد.":"برنده: "+p.winner)}
 function startRound(){if(role!=="host"||!opponent||finished)return;round++;hostHits={};const payload={round,goAt:Date.now()+2400+Math.floor(Math.random()*900)};send("round-start",payload);beginLocalRound(payload);roundTimer=setTimeout(()=>{if(role!=="host"||finished)return;[id,opponent.id].forEach(pid=>{if(!(pid in hostHits))hostHits[pid]=6000});settleRound()},Math.max(0,payload.goAt-Date.now())+6500)}
 async function closeRoom(notify=true){clearTimers();active=false;hit.disabled=true;if(channel){if(notify)send("leave",{id});try{await channel.unsubscribe()}catch(_){}channel=null}role=null;code="";opponent=null;resetState();room.classList.add("hidden");leave.classList.add("hidden");say("برای بازی دونفره، اتاق بساز یا کد دوستت را وارد کن.");create.disabled=false;join.disabled=false}
 function onEvent(event,payload){
  if(!payload)return;
  if(event==="join"&&role==="host"&&!opponent){if(payload.id===id)return;opponent={id:payload.id,name:payload.name||"بازیکن دوم"};paintPlayers();send("lobby",{host:{id,name},guest:opponent});say("حریف وارد شد؛ بازی تا چند لحظه دیگر شروع می‌شود.");setTimeout(startRound,1800)}
  if(event==="lobby"&&role==="guest"){opponent=payload.host;paintPlayers();say("به اتاق وصل شدی؛ منتظر شروع بازی باش.")}
  if(event==="round-start"&&role==="guest")beginLocalRound(payload);
  if(event==="hit"&&role==="host"&&payload.round===round&&opponent&&payload.id===opponent.id&&!Object.prototype.hasOwnProperty.call(hostHits,payload.id)){hostHits[payload.id]=Math.min(6000,Math.max(0,Number(payload.ms)||6000));settleRound()}
  if(event==="round-result"&&role==="guest"){round=payload.round;totals=payload.totals||{};renderScores(payload.values||{});active=false;hit.disabled=true;if(round>=5)say("پنج دور تمام شد؛ نتیجه نهایی در راه است.")}
  if(event==="match-end"&&role==="guest"){totals=payload.totals||{};showWinner(payload);persistDuelRecord(payload)}
  if(event==="leave"&&payload.id!==id){say("حریف از اتاق خارج شد.");active=false;hit.disabled=true;opponent=null;paintPlayers()}
 }
 async function connect(roomCode,asRole){
  if(typeof db==="undefined"||!db?.channel){say("ارتباط زندهٔ بازی در دسترس نیست؛ اتصال سامانه را بررسی کن.");return}
  await closeRoom(false);resetState();code=roomCode;role=asRole;name=playerName();showRoom();create.disabled=true;join.disabled=true;say(asRole==="host"?"در حال ساخت اتاق…":"در حال ورود به اتاق…");
  channel=db.channel("upland-duel-"+code,{config:{broadcast:{self:false}}});
  ["join","lobby","round-start","hit","round-result","match-end","leave"].forEach(ev=>channel.on("broadcast",{event:ev},({payload})=>onEvent(ev,payload)));
  channel.subscribe(async state=>{if(state!=="SUBSCRIBED")return;if(asRole==="host"){say("اتاق ساخته شد؛ کد را برای دوستت بفرست.");send("lobby",{host:{id,name},guest:null})}else{send("join",{id,name});say("درخواست ورود ارسال شد؛ منتظر میزبان بمان.")}});
 }
 create.addEventListener("click",()=>{const c=String(Math.floor(100000+Math.random()*900000));connect(c,"host").catch(e=>say("ساخت اتاق ناموفق بود: "+(e.message||e)))});
 join.addEventListener("click",()=>{const c=(codeInput.value||"").replace(/\D/g,"").slice(0,6);if(c.length!==6){say("کد اتاق باید ۶ رقم باشد.");return}connect(c,"guest").catch(e=>say("ورود به اتاق ناموفق بود: "+(e.message||e)))});
 hit.addEventListener("click",()=>{if(!active||Date.now()<goAt)return;active=false;hit.disabled=true;const ms=Math.max(0,Date.now()-goAt);result.textContent="زمان واکنش تو: "+fa(ms)+" میلی‌ثانیه";if(role==="host"){hostHits[id]=ms;settleRound()}else send("hit",{id,round,ms})});
 leave.addEventListener("click",()=>closeRoom(true));
 codeInput.addEventListener("keydown",e=>{if(e.key==="Enter")join.click()});
 window.addEventListener("beforeunload",()=>{if(channel)send("leave",{id})});
 say("برای بازی آنلاین، یک نفر اتاق بسازد و کد ۶ رقمی را برای نفر دوم بفرستد.");
})();
})();
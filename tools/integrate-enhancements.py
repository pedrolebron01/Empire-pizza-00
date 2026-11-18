from pathlib import Path
import os
root=Path(__file__).resolve().parent.parent
def write(p,s):
    tmp=p.with_name(p.name+'.enhanced.tmp');tmp.write_text(s,encoding='utf-8');os.replace(tmp,p)
p=root/'core.js';s=p.read_text(encoding='utf-8')
s=s.replace("volume:.35,quality:'media'", "volume:.35,sfxVolume:.35,musicVolume:.22,sfxMuted:false,musicMuted:false,cameraZoom:1.15,daily:null,quality:'media'")
marker="d.quality=['baixa','media','alta']"
extra="""d.sfxVolume=Number.isFinite(s.sfxVolume)?Math.max(0,Math.min(1,s.sfxVolume)):d.volume;d.musicVolume=Number.isFinite(s.musicVolume)?Math.max(0,Math.min(1,s.musicVolume)):.22;d.sfxMuted=s.sfxMuted===true;d.musicMuted=s.musicMuted===true;d.cameraZoom=Number.isFinite(s.cameraZoom)?Math.max(.8,Math.min(1.5,s.cameraZoom)):1.15;if(s.daily&&/^\\d{4}-\\d{2}-\\d{2}$/.test(s.daily.day)){d.daily={day:s.daily.day,served:0,fast:0,special:0,claimed:[]};for(const k of ['served','fast','special'])d.daily[k]=Math.max(0,Math.min(10000,Math.floor(Number(s.daily[k])||0)));d.daily.claimed=Array.isArray(s.daily.claimed)?[...new Set(s.daily.claimed.filter(i=>Number.isInteger(i)&&i>=0&&i<3))]:[];}"""
assert marker in s;s=s.replace(marker,extra+marker)
write(p,s)
p=root/'game.js';s=p.read_text(encoding='utf-8')
s="import {RestaurantAudio} from './audio.js';\nimport {DAILY_GOALS,ensureDaily,recordDaily,nearestUnlock,specialCustomer,specialBonus,comboBonus,eventAt} from './progression.js';\n"+s
start=s.index('let audio;function sound(');end=s.index('const scene=',start)
s=s[:start]+"const music=new RestaurantAudio(()=>state);function sound(kind,delay=0){music.effect(kind,delay);}\nlet knownLevel=level(state),streak=0,guideRing=null,currentEvent=-1,eventServed=0,eventRecipes=new Set(),eventPaid=false,eventWarned=false,eventStarted=false;\nconst notices=[];\n"+s[end:]
s=s.replace("function toast(t){$('#toast').textContent=t;$('#toast').style.opacity=1;toastTime=4;}","function toast(t){if(toastTime>0){if(!notices.includes(t))notices.push(t);return;}$('#toast').textContent=t;$('#toast').style.opacity=1;toastTime=3.5;}\nfunction tickNotices(dt){toastTime-=dt;if(toastTime<=0){$('#toast').style.opacity=0;if(notices.length)toast(notices.shift());}}")
# One-time action sounds, never emitted by continuous walking/preparing animation.
s=s.replace("let vip=state.served>=8&&Math.random()<.18;", "let special=specialCustomer(state.served,serial),vip=!!special;")
s=s.replace("qty:vip?2:1,remaining:vip?2:1,patience:180,maxPatience:180,status:'enter',vip", "qty:special?.qty||1,remaining:special?.qty||1,patience:special?.patience||180,maxPatience:special?.patience||180,status:'enter',vip,special,perfect:true")
s=s.replace("selected??=c.id;sound('order');", "selected??=c.id;sound('arrival');if(special)toast(special.name+' chegou! '+special.qty+' pizza(s) · bônus até R$ '+special.money+'.');")
s=s.replace("if(navigate(c,target,1.5,dt))c.status='wait';", "if(navigate(c,target,1.5,dt)&&c.status!=='wait'){c.status='wait';sound('order');}")
s=s.replace("c.status='exit';combo=0;toast", "c.status='exit';combo=0;streak=0;sound('leave');toast")
s=s.replace("roberto.carrying=[];refreshPizzas();toast", "roberto.carrying=[];refreshPizzas();sound('helperDrop');toast")
s=s.replace("roberto.carrying.push(...ready);", "roberto.carrying.push(...ready);if(ready.length)sound('helperTake');")
start=s.index('function checkProgress()');end=s.index('function interact()',start)
s=s[:start]+'''function checkProgress(){
  for(const m of claim(state)){toast(`Missão concluída: ${m.name}! +R$ ${m.money} · +${m.xp} XP`);sound('mission');}
  for(let n=knownLevel+1;n<=level(state);n++)toast(`Nível ${n}! ${RECIPES[n-1].name} desbloqueada. Escolha na bancada!`);
  if(level(state)>knownLevel)sound('level',.5);
  knownLevel=level(state);save();
}
function deliver(c,p,source){
  if(c.status!=='wait')return toast('Espere o cliente chegar ao lugar na fila.');
  if(p.stage!=='ready'||!source.includes(p))return;
  if(c.recipe!==p.recipe){combo=0;streak=0;sound('wrong');return toast('Receita diferente. Combo encerrado. Guarde esta pizza ou refaça o pedido.');}
  source.splice(source.indexOf(p),1);streak++;combo=Math.min(streak,5);
  const fast=c.patience/c.maxPatience>.5;
  c.perfect=c.perfect&&p.quality>=1&&fast;
  const gain=reward(state,p.recipe,c.patience/c.maxPatience,p.quality??1,combo,rush);
  c.remaining--;
  const finished=!c.remaining;
  if(finished){
    const bonus=specialBonus(c.special,c.perfect);
    if(bonus){state.money+=bonus.money;state.xp+=bonus.xp;toast(`${c.special.name}: +R$ ${bonus.money} · +${bonus.xp} XP de bônus!`);}
    else if(c.special)toast('Crítico atendido. O bônus exige pizza no ponto e entrega antes de metade da paciência.');
    c.status='exit';if(selected===c.id)selected=customers.find(x=>x.status!=='exit'&&x!==c)?.id??null;
  }
  sound('delivery');sound('cash',.3);if(gain.tip)sound('tip',.5);
  toast(`Entrega concluída! +R$ ${gain.total} (inclui R$ ${gain.tip} de gorjeta) · +${Math.round(22*(p.quality??1))} XP`);
  const streakReward=comboBonus(streak);
  if(streakReward){state.money+=streakReward.money;state.xp+=streakReward.xp;sound('combo',.7);toast(`Sequência de ${streak}! +R$ ${streakReward.money} · +${streakReward.xp} XP`);}
  for(const goal of recordDaily(state,{fast,special:finished&&!!c.special})){toast(`Meta diária: ${goal.title}! +R$ ${goal.money} · +${goal.xp} XP`);sound('mission',.9);}
  recordEvent(p.recipe);checkProgress();refreshPizzas();renderUI();
}
''' +s[end:]
s=s.replace("heldIndex=hand.length-1;sound('tap');refreshPizzas();", "heldIndex=hand.length-1;sound('dough');refreshPizzas();")
s=s.replace("refreshPizzas();sound('oven');return;", "refreshPizzas();sound('ovenOut');return;")
s=s.replace("ovens.push(p);refreshPizzas();sound('tap');", "ovens.push(p);refreshPizzas();sound('ovenIn');")
s=s.replace("closeModal();refreshPizzas();renderUI();sound('tap');\n    toast('Pizza guardada", "closeModal();refreshPizzas();renderUI();sound('store');\n    toast('Pizza guardada")
s=s.replace("sound('tap');toast('Pizza retirada", "sound('take');toast('Pizza retirada")
s=s.replace("if(r>=3)state.stock[r]--;p.recipe=r;", "if(r>=3)state.stock[r]--;sound('ingredient');sound('prep',.15);p.recipe=r;")
s=s.replace("if(buy(state,b.dataset.buy)){sound('level');", "if(buy(state,b.dataset.buy)){sound('purchase');if(b.dataset.buy==='expand'){sound('expansion',.3);toast('Novo salão aberto! Duas mesas novas e espaço para mais 2 clientes.');}else toast(UPGRADES[b.dataset.buy].name+' melhorado! '+UPGRADES[b.dataset.buy].desc(state.upgrades[b.dataset.buy]));")
s=s.replace("save();sound('cash');showStock();", "save();sound('restock');toast('Despensa abastecida: +8 porções por R$ 24.');showStock();")
s=s.replace("p.stage='ready';sound('oven');", "p.stage='ready';sound('ovenReady');")
s=s.replace("if(p.stage==='ready')p.quality=p.elapsed>p.duration+18?.6:1;", "if(p.stage==='ready'&&p.elapsed>p.duration+18&&p.quality!==.6){p.quality=.6;sound('burn');toast('Uma pizza passou do ponto. Ainda pode ser entregue com valor reduzido.');refreshPizzas();}")
s=s.replace("toast('Pizza montada. Agora leve ao forno!');", "sound('prepDone');toast('Pizza montada. Agora leve ao forno!');")
# Replace old event calculation, preserving the existing restaurant update loop.
start=s.index('let cycle=time%180;');end=s.index('updatePrompt();',start)
s=s[:start]+'updateEvent();'+s[end:]
s=s.replace("function frame(dt){if(started&&!paused){time+=dt;toastTime-=dt;if(toastTime<=0)$('#toast').style.opacity=0;", "function frame(dt){tickNotices(dt);music.setScene({rush,paused,hidden:document.hidden});music.tick();if(guideRing)guideRing.scale.setScalar(1+Math.sin(time*3)*.08);if(started&&!paused){time+=dt;")
s=s.replace("function renderUI(){$('#money')", "function renderUI(){updateEnhancementUI();$('#money')")
s=s.replace("let dist=innerWidth<700?30:24;", "let dist=(innerWidth<700?25:22)/state.cameraZoom;")
s=s.replace("player.g.position.x*.22,0,player.g.position.z*.14", "player.g.position.x*.55,0,player.g.position.z*.45")
s=s.replace("${c.vip?'★ ':''}#${String(c.id)", "${c.special?'★ '+c.special.name+' · ':''}#${String(c.id)")
s=s.replace("${c.vip?' + bônus':''}", "${c.special?' + até R$ '+c.special.money+' bônus':''}")
s=s.replace("$('#combo').textContent=`✦ COMBO ${combo} · GORJETAS ×${Math.min(2,1+combo*.2).toFixed(1)}`", "$('#combo').textContent=`✦ ${streak} acertos · gorjetas ×${Math.min(2,1+combo*.2).toFixed(1)}${streak<3?' · bônus em 3':streak<5?' · bônus em 5':' · multiplicador máximo'}`")
s=s.replace("addEventListener('keydown',e=>{if([", "addEventListener('keydown',e=>{if(e.target.closest?.('input,select,textarea'))return;if([")
# Keep volume and reset controls together in the current pause menu.
s=s.replace('<label>Volume <input id="volume" type="range" min="0" max="1" step=".05" value="${state.volume}"></label>', '''<div class="audio-settings"><label for="music-volume">Música ambiente <output id="music-value">${Math.round(state.musicVolume*100)}%</output></label><input id="music-volume" aria-label="Volume da música" type="range" min="0" max="1" step=".05" value="${state.musicVolume}"><button id="music-mute" aria-pressed="${state.musicMuted}">${state.musicMuted?'Ativar música':'Silenciar música'}</button><label for="sfx-volume">Efeitos sonoros <output id="sfx-value">${Math.round(state.sfxVolume*100)}%</output></label><input id="sfx-volume" aria-label="Volume dos efeitos" type="range" min="0" max="1" step=".05" value="${state.sfxVolume}"><button id="sfx-mute" aria-pressed="${state.sfxMuted}">${state.sfxMuted?'Ativar efeitos':'Silenciar efeitos'}</button></div>''')
old="$('#volume').oninput=e=>{state.volume=+e.target.value;sound('tap');save();};"
new="""for(const kind of ['music','sfx']){const key=kind+'Volume',mute=kind+'Muted';$('#'+kind+'-volume').oninput=e=>{state[key]=+e.target.value;if(kind==='sfx')state.volume=state[key];$('#'+kind+'-value').textContent=Math.round(state[key]*100)+'%';music.apply();save();updateEnhancementUI();};$('#'+kind+'-volume').onchange=()=>{if(kind==='sfx')sound('tap');};$('#'+kind+'-mute').onclick=()=>{state[mute]=!state[mute];music.apply();save();showPause();updateEnhancementUI();};}"""
assert old in s;s=s.replace(old,new)
s=s.replace("function showMissions(){showModal('<span", "function showMissions(){showModal(dailyMarkup()+'<span")
s=s.replace("rebuild();quality();loadAssets();renderUI();", "initEnhancements();rebuild();quality();loadAssets();renderUI();")
s=s.replace("$('#start').onclick=()=>{started=true;", "$('#start').onclick=()=>{music.unlock();started=true;")
s=s.replace("spawn();sound('level');toast", "spawn();toast")
s+='\n'+(root/'tools/enhancement-ui.txt').read_text(encoding='utf-8')
write(p,s)
print('Sistemas existentes integrados: áudio, progressão, guia e migração compatível.')

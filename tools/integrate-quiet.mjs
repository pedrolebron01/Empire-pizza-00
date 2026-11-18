import fs from 'node:fs';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8'),write=(p,s)=>fs.writeFileSync(new URL(p,root),s);
let s=read('game.js');
s="import {STORY_CHAPTERS,SERVICES,restoreService,currentService,startService,serviceOrder,recordService,serviceProgress} from './service.js';\n"+s;
s=s.replace("state=fresh();}\n", "state=fresh();}\nstate.service=restoreService(state.service);\n");
// Archive old contracts as optional activities; story services are the main campaign.
s=s.replace("const contract=currentContract(state);if(contract?.recipe", "const directed=serviceOrder(state,serial);const contract=currentContract(state);if(contract?.recipe");
s=s.replace("let special=specialCustomer(state.served,serial)", "if(directed)r=directed.recipe;let special=directed?.qty===2?{name:'Mesa de '+directed.host,qty:2,patience:260,money:20,xp:15,kind:'family'}:specialCustomer(state.served,serial)");
s=s.replace("name:['Sofia'", "serviceId:directed?state.service.index:null,priority:directed?.priority||false,name:['Sofia'");
s=s.replace("customers.push(c);selected??=c.id;", "if(directed?.priority){c.patience=c.maxPatience=115;c.name=directed.host+' · prioritário';}customers.push(c);selected??=c.id;");
// The story never consumes a pizza twice: observe the existing delivery transaction.
s=s.replace("recordVisit(c,p,finished);", "recordVisit(c,p,finished);if(c.serviceId===state.service.index)serviceFeedback(recordService(state,'delivery',{recipe:p.recipe,quality:p.quality??1,source:source===shelf?'shelf':'hand'}));");
s=s.replace("if(['store','helperDrop','restock'].includes(kind))recordCampaign(kind);", "if(['store','helperDrop','restock'].includes(kind)){recordCampaign(kind);recordService(state,kind);save();}");
s=s.replace("state.campaign.seconds+=dt;", "state.campaign.seconds+=dt;if(state.service.active)state.service.seconds+=dt;");
s=s.replace("spawnClock>(rush?8:20)", "spawnClock>(state.service.active?6:rush?8:20)");
s=s.replace("renderUI();uiClock=0;", "renderUI();updateQuietHUD();uiClock=0;");
// Hide clutter in the 3D view. Only the current nearest station gets a short label.
s=s.replace("const relevant=!stationId||stationId===guideStation||close;", "const relevant=!!stationId&&nearest?.id===stationId;l.el.classList.toggle('hud-near',relevant);");
s=s.replace("if(!notices.includes(t)&&notices.length<4)notices.push(t)", "if(!notices.includes(t)&&notices.length<1)notices.push(t)");
s=s.replace("$('#pause').onclick=showPause;", "$('#pause').onclick=showGameMenu;");
s=s.replace("paused?closeModal():showPause();", "paused?closeModal():showGameMenu();");
s=s.replace("if(started&&!paused)showPause();", "if(started&&!paused)showGameMenu();");
s=s.replace("if(document.hidden&&started&&!paused)showPause();", "if(document.hidden&&started&&!paused)showGameMenu();");
s=s.replace("function closeModal(){if(!started)", "function closeModal(){if(!started)");
s=s.replace("$('#modal').classList.add('hidden');keysReset();", "$('#modal').classList.add('hidden');keysReset();if($('#service-hud'))updateQuietHUD();");
s+=`\n// A single HUD reads existing gameplay state instead of creating another simulation.
const quiet=document.createElement('section');quiet.id='service-hud';quiet.setAttribute('aria-label','Atendimento atual');quiet.innerHTML='<div class="hud-heading"><span id="hud-caption">PEDIDO ATUAL</span><button id="hud-switch">Trocar</button></div><div id="hud-customer"></div><p id="hud-order"></p><p id="hud-action" aria-live="polite"></p><p id="hud-states"></p><button id="hud-do">Continuar</button><p id="hud-progress"></p><p id="hud-notice" role="status"></p>';document.body.append(quiet);
$('#hud-switch').onclick=showOrders;
$('#hud-do').onclick=()=>{const lesson=tutorial.active?LESSONS[tutorial.step]?.[0]:null;if(lesson==='select')return showOrders();if(lesson==='purchase')return showUpgrades();if(lesson==='roberto')return showRoberto();if(work)return cancelPrep();if(nearest&&nearest.id===guideStation)return interact();$('#guide-action').click();};
function updateQuietHUD(){
 const c=customers.find(x=>x.id===selected&&x.status!=='exit'),sp=serviceProgress(state),svc=currentService(state);
 $('#hud-customer').textContent=c?c.name:'Portas abertas';$('#hud-order').textContent=c?c.remaining+' × '+RECIPES[c.recipe].name+(c.priority?' · prioridade':''):state.service.active?'O próximo pedido já está chegando.':'Escolha um serviço no Menu para continuar a história.';
 $('#hud-action').textContent=$('#guide-title').textContent;
 const held=hand[heldIndex]||hand[0],ready=ovens.filter(p=>p.stage==='ready').length;
 const oven=ready?'✓ Forno: '+ready+' pronta(s)':ovens.length?'◷ Forno: '+Math.max(0,Math.ceil(ovens[0].duration-ovens[0].elapsed))+' s':'';
 const tray=held?'Bandeja: '+(held.stage==='dough'?'massa':RECIPES[held.recipe].name)+' · '+({ready:'pronta',raw:'montada',preparing:'em preparo'}[held.stage]||'crua')+(hand.length>1?' +'+(hand.length-1):''):'';
 $('#hud-states').textContent=[tray,oven].filter(Boolean).join(' · ');
 $('#hud-progress').textContent=sp?(state.service.active?'Cap. '+(svc.chapter+1)+' · '+sp.title+' · '+sp.count+'/'+sp.goal:'Campanha · próximo: '+sp.title):'✓ Festival concluído · desafios livres';
 $('#hud-notice').textContent=toastTime>0?$('#toast').textContent:'';
 const event=eventAt(time);if(!$('#hud-notice').textContent&&(event.active||event.warning))$('#hud-notice').textContent=event.active?event.name+' · '+event.remaining+' s':event.name+' em '+event.remaining+' s';
 $('#hud-do').textContent=work?'Cancelar preparo':nearest?.id===guideStation?'E · '+({dough:'Pegar massa',bench:'Escolher receita',oven:ready?'Retirar pizza':'Colocar no forno',counter:'Abrir Balcão'}[guideStation]||'Interagir'):'Ir à estação';
 if(tutorial.active){const lesson=LESSONS[tutorial.step][0];$('#hud-caption').textContent='COM ROBERTO · '+(tutorial.step+1)+'/10';if(['select','purchase','roberto'].includes(lesson))$('#hud-do').textContent={select:'Escolher pedido',purchase:'Ver melhorias',roberto:'Conversar com Roberto'}[lesson];}else $('#hud-caption').textContent='PEDIDO ATUAL';
 $('#hud-do').disabled=!started;
}
function cancelPrep(){if(!work)return;const p=work.pizza;if(p.recipe>=3)state.stock[p.recipe]++;p.stage='dough';p.recipe=null;work=null;$('#work').style.display='none';refreshPizzas();save();renderUI();updateQuietHUD();}
function showOrders(){const active=customers.filter(c=>c.status!=='exit');showModal('<h2>Pedidos</h2><p>Escolha o cliente que você vai atender.</p>'+active.map(c=>'<div class="recipe"><span><b>'+c.name+'</b><br>'+c.remaining+' × '+RECIPES[c.recipe].name+' · '+Math.ceil(c.patience)+' s</span><button data-quiet-order="'+c.id+'">'+(c.id===selected?'✓ Selecionado':'Atender')+'</button></div>').join(''));document.querySelectorAll('[data-quiet-order]').forEach(b=>b.onclick=()=>{selected=+b.dataset.quietOrder;advanceTutorial('select');renderUI();closeModal();});}
function showGameMenu(){showModal('<span class="eyebrow">PIZZA EMPIRE</span><h2>Sua pizzaria</h2><p>O jogo está pausado.</p><div class="menu-grid"><button id="menu-story">Campanha</button><button id="menu-orders">Pedidos</button><button id="menu-upgrades">Melhorias</button><button id="menu-tray">Bandeja</button><button id="menu-contracts">Metas e histórico</button><button id="menu-settings">Configurações</button><button id="menu-help">Como jogar</button><button id="menu-roberto">Roberto</button></div><button id="menu-resume">Voltar ao jogo</button>');const handlers={story:showStory,orders:showOrders,upgrades:showUpgrades,tray:showTray,contracts:showMissions,settings:showPause,help:showHelp,roberto:showRoberto,resume:closeModal};for(const [key,fn]of Object.entries(handlers))$('#menu-'+key).onclick=fn;}
function showTray(){showModal('<h2>Sua bandeja</h2><p>Selecione qual pizza você quer guardar ou entregar. Use E perto do Balcão para guardar e recuperar.</p>'+hand.map((p,i)=>'<button data-held="'+i+'">'+(i===heldIndex?'✓ ':'')+(p.stage==='dough'?'Massa':RECIPES[p.recipe].name)+' · '+p.stage+'</button>').join(''));document.querySelectorAll('[data-held]').forEach(b=>b.onclick=()=>{heldIndex=+b.dataset.held;renderUI();closeModal();});}
function showStory(){const t=currentService(state),p=state.service,sp=serviceProgress(state);if(!t)return showModal('<h2>O festival é nosso!</h2><p>Você concluiu os 36 serviços da história.</p><p>'+Math.floor(p.seconds/60)+' minutos em serviços · '+state.served+' pizzas entregues.</p><p>Recompensa: R$ 750, faixa do festival e gorjetas +10%. Metas diárias, VIPs e contratos continuam disponíveis no Menu.</p>');const ch=STORY_CHAPTERS[t.chapter];showModal('<span class="eyebrow">CAPÍTULO '+(t.chapter+1)+' DE 6</span><h2>'+ch.name+'</h2><p>Roberto: “'+ch.story+'”</p><div class="service-card"><h3>'+t.title+'</h3><p>'+t.host+': '+t.text+'</p><p>Rodada '+(p.wave+1)+'/4 · '+sp.count+'/'+sp.goal+' pizzas · próximo sabor: '+RECIPES[sp.recipe].name+'</p><p>Recompensa: R$ '+t.money+' + '+(30+t.chapter*5)+' XP</p><p>Próximo marco: '+sp.next+'</p></div><button id="story-begin">'+(p.active?'Retomar serviço':'Começar / continuar serviço')+'</button><button id="story-free">Atendimento livre</button>');$('#story-begin').onclick=()=>{if(t.requires==='helper'&&!state.upgrades.helper){showUpgrades();return;}startService(state);save();closeModal();spawnClock=7;toast('Serviço iniciado: '+t.title+'. '+t.text);};$('#story-free').onclick=()=>{state.service.active=false;save();closeModal();};}
function serviceFeedback(result){if(!result)return;if(result.hint){const hint=result.hint.replace(/sabor é (\\d)/,(_,r)=>'sabor é '+RECIPES[+r].name);toast(hint);}if(result.wave)toast('✓ Rodada concluída. Próxima combinação liberada.');if(result.finished){sound('mission');toast('✓ '+result.service.title+' concluído! +R$ '+result.service.money);if(result.chapter){rebuild();showStory();}}save();}
$('#pause').textContent='Menu';$('#pause').setAttribute('aria-label','Abrir menu da pizzaria');updateQuietHUD();
`;
write('game.js',s);
let c=read('core.js');c="import {restoreService} from './service.js';\n"+c;c=c.replace("campaign:campaignState(),", "campaign:campaignState(),service:restoreService(),");c=c.replace("d.campaign=campaignState(s.campaign);", "d.campaign=campaignState(s.campaign);d.service=restoreService(s.service);");c=c.replace("s.campaign?.complete?1.1:1", "s.campaign?.complete||s.service?.complete?1.1:1");write('core.js',c);
let h=read('index.html');h=h.replace('</head>','<link rel="stylesheet" href="quiet-hud.css"></head>');write('index.html',h);
console.log('Single HUD and story services integrated.');

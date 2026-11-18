import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const write=(p,s)=>writeFileSync(new URL(p,root),s);
let s=read('core.js');
s="import {campaignState} from './campaign.js';\n"+s;
s=s.replace('version:1,tutorialComplete:false','version:1,campaign:campaignState(),tutorialProgress:null,reducedMotion:null,particles:true,tutorialComplete:false');
s=s.replace("d.tutorialComplete=s.tutorialComplete===true;","d.campaign=campaignState(s.campaign);d.reducedMotion=typeof s.reducedMotion==='boolean'?s.reducedMotion:null;d.particles=s.particles!==false;d.tutorialProgress=s.tutorialProgress&&typeof s.tutorialProgress==='object'?{done:Array.isArray(s.tutorialProgress.done)?s.tutorialProgress.done.filter(x=>typeof x==='string'):[],skipped:s.tutorialProgress.skipped===true}:null;d.tutorialComplete=s.tutorialComplete===true;");
s=s.replace('const total=Math.round(base*quality+tip);','const total=Math.round(base*quality+tip*(s.campaign?.complete?1.1:1));');
write('core.js',s);
write('tutorial.js',`export const LESSONS=[
 ['move','Movimente-se pela pizzaria','Use WASD, setas ou o joystick.'],
 ['select','Selecione um pedido','Clique na comanda e identifique o nome do cliente.'],
 ['dough','Pegue uma massa','Vá à Massa e pressione E, ou clique no marcador.'],
 ['prepDone','Prepare a receita do cliente','Escolha a receita na Bancada.'],
 ['ovenIn','Coloque a pizza no Forno','Leve a pizza montada ao Forno.'],
 ['ovenOut','Retire a pizza pronta','Espere o texto Pronta e retire no Forno.'],
 ['counter','Leve a pizza ao Balcão','Abra o Balcão com E; você também pode guardar pizzas.'],
 ['delivery','Entregue o pedido correto','No Balcão, entregue ao cliente selecionado.'],
 ['purchase','Compre uma melhoria','Abra Melhorar pizzaria; faça mais entregas se faltar dinheiro.'],
 ['roberto','Converse com Roberto','Aproxime-se do Roberto e pressione E.']
];
export class Tutorial {
 constructor(saved){this.active=false;this.step=0;this.confirmation='';this.done=new Set(saved?.done?.filter(e=>LESSONS.some(l=>l[0]===e))||[]);this.skipped=!!saved?.skipped;this.sync();}
 sync(){this.step=LESSONS.findIndex(l=>!this.done.has(l[0]));if(this.step<0){this.step=LESSONS.length;this.active=false;}}
 start(restart=false){if(restart)this.done.clear();this.skipped=false;this.active=true;this.sync();}
 record(event){if(!this.active||!LESSONS.some(l=>l[0]===event)||this.done.has(event))return false;this.done.add(event);this.confirmation='✓ Etapa concluída';this.sync();return true;}
 snapshot(){return {done:[...this.done],skipped:this.skipped};}
}
`);
s=read('game.js');
s="import {CHAPTERS,CONTRACTS,currentContract,campaignEvent,campaignMarkup} from './campaign.js';\n"+s;
s=s.replace('const tutorial=new Tutorial();','const tutorial=new Tutorial(state.tutorialProgress);\nconst motionReduced=()=>state.reducedMotion??matchMedia("(prefers-reduced-motion: reduce)").matches;\nlet introTime=0;');
s=s.replace("function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}","function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}");
s=s.replace("advanceTutorial(kind);}","advanceTutorial(kind);if(['store','helperDrop','restock'].includes(kind))recordCampaign(kind);}");
s=s.replace('id:serial++,recipe:r','name:[\'Sofia\',\'Miguel\',\'Lia\',\'Davi\',\'Clara\',\'Bento\',\'Ana\',\'Caio\'][serial%8],id:serial++,recipe:r');
s=s.replace('let special=specialCustomer(state.served,serial)',"const contract=currentContract(state);if(contract?.recipe!==undefined&&RECIPES[contract.recipe].level<=level(state))r=contract.recipe;let special=specialCustomer(state.served,serial)");
s=s.replace("{x:1.5,z:4.25}];","{x:1.5,z:4.25},{x:4.4,z:4.25},{x:6,z:4.25}];");
s=s.replace("#${c.id} ${c.remaining}","${c.name} · #${c.id} ${c.remaining}");
s=s.replace("#${String(c.id).padStart(2,'0')} ·", "${c.name} · #${String(c.id).padStart(2,'0')} ·");
s=s.replace('if(tutorial.active&&tutorial.step<4)return;',"if(tutorial.active&&!tutorial.done.has('ovenOut'))return;");
s=s.replace("recordEvent(p.recipe);checkProgress();", "recordCampaign('delivery',{recipe:p.recipe,quality:p.quality??1,fast,streak});recordCampaign('tips',{amount:gain.tip});if(finished&&c.special)recordCampaign('special');recordEvent(p.recipe);checkProgress();");
s=s.replace("function showCounter(){", "function showCounter(){if(hand.some(p=>p.stage==='ready')||shelf.some(p=>p.stage==='ready'))advanceTutorial('counter');");
s=s.replace("tutorial.step===1&&target", "!tutorial.done.has('prepDone')&&target");
s=s.replace("function showRoberto(){showModal", "function showRoberto(){advanceTutorial('roberto');recordCampaign('roberto');showModal");
s=s.replace("function showMissions(){const next", "function showMissions(){const next");
s=s.replace("showModal(art('expand','↗',true)","showModal(campaignMarkup(state)+art('expand','↗',true)");
s=s.replace("sound('purchase');if(b.dataset", "recordCampaign('upgrade');sound('purchase');if(b.dataset");
s=s.replace("selected=+el.dataset.order;renderUI();", "selected=+el.dataset.order;advanceTutorial('select');document.body.classList.remove('all-orders');renderUI();");
s=s.replace("function renderUI(){updateEnhancementUI();", "function renderUI(){updateEnhancementUI();");
s=s.replace("$('#combo').style.display=combo?", "const contract=currentContract(state);$('#missiontitle').textContent=contract?CHAPTERS[contract.chapter][0]:'Festival concluído!';$('#missiondesc').textContent=contract?contract.title+' · '+state.campaign.count+'/'+contract.goal:'Troféu conquistado · desafios opcionais disponíveis';$('#missionbar').style.width=contract?Math.min(100,state.campaign.count/contract.goal*100)+'%':'100%';$('#missionreward').textContent=contract?'R$ '+contract.money+' · '+contract.xp+' XP':'Gorjetas permanentes +10%';$('#inventory').hidden=!hand.length;$('#combo').style.display=combo?");
s=s.replace("if(len){x/=", "if(len){advanceTutorial('move');x/=");
s=s.replace("time+=dt;updatePlayer(dt);", "time+=dt;state.campaign.seconds+=dt;updatePlayer(dt);");
s=s.replace("if(guideRing)guideRing.scale.setScalar(1+Math.sin(time*3)*.08);", "if(guideRing)guideRing.scale.setScalar(motionReduced()?1:1+Math.sin(time*3)*.08);if(!started){introTime+=dt;if(!motionReduced())animatePerson(roberto,dt,false,true);}");
s=s.replace("guideRing.visible=started;", "guideRing.visible=started&&Math.hypot(player.g.position.x-points[station].x,player.g.position.z-points[station].z)>1.1;");
s=s.replace("m.visible=!!sources.length&&state.quality!=='baixa'", "m.visible=!!sources.length&&state.particles&&!motionReduced()&&state.quality!=='baixa'");
s=s.replace("let sources=[...ovens", "let sources=[...(!started?[new T.Vector3(-.65,2.7,-4.55)]:[]),...ovens");
s=s.replace("let t=(time*.65+i*.19)%1", "let t=((started?time:introTime)*.65+i*.19)%1");
s=s.replace("focus.x+dist*.45", "focus.x+dist*.45+(!started&&!motionReduced()?Math.sin(introTime*.15)*.7:0)");
s=s.replace("if(step===5)", "if(LESSONS[step][0]==='purchase')");
s=s.replace("tutorial.active&&tutorial.step===5", "tutorial.active&&LESSONS[tutorial.step]?.[0]==='purchase'");
s=s.replace("$('#guide-title').textContent=title;", "if(tutorial.active){title=LESSONS[tutorial.step][1];detail=LESSONS[tutorial.step][2]+' '+detail;}$('#guide-title').textContent=title;");
s=s.replace("tutorial.active=false;lesson.hidden=true;", "tutorial.active=false;tutorial.skipped=true;state.tutorialProgress=tutorial.snapshot();save();lesson.hidden=true;");
s=s.replace('Continuar sem tutorial','Pular tutorial');
s=s.replace("startTutorial();};}", "startTutorial(true);};}");
s=s.replace("function startTutorial(){tutorial.start();", "function startTutorial(restart=false){tutorial.start(restart);");
s=s.replace("function advanceTutorial(event){if(!tutorial.record(event))return;", "function advanceTutorial(event){if(!tutorial.record(event))return;state.tutorialProgress=tutorial.snapshot();save();");
s=s.replace("if(!state.tutorialComplete&&state.served===0)startTutorial();", "if(!state.tutorialComplete&&!tutorial.skipped)startTutorial();document.body.classList.add('playing');");
s=s.replace("${state.served?'Reabrir minha pizzaria':'Abrir as portas'}", "${state.served||state.purchases||state.tutorialProgress?'Continuar':'Começar'}");
// Reuse the original start handler, preserving startup flow and saved state.
const marker='let previous=performance.now();';
s=s.replace(marker,`const startGame=$('#start').onclick;
function home(){showModal('<span class="eyebrow">DO BALCÃO AO IMPÉRIO</span><h1>Pizza Empire</h1><p>Forno aceso. Uma nova história em cada mesa.</p><button id="start">'+(state.served||state.purchases||state.tutorialProgress?'Continuar':'Começar')+'</button><div class="dialog-actions"><button id="home-help">Como jogar</button><button id="home-settings">Configurações</button><button id="home-credits">Créditos e licenças</button><button id="home-new">Nova partida</button></div>');$('#close').classList.add('hidden');$('#start').onclick=startGame;$('#home-help').onclick=showHelp;$('#home-settings').onclick=showPause;$('#home-new').onclick=()=>{showPause();$('#reset').click();};$('#home-credits').onclick=()=>showModal('<h2>Feito para a nossa pizzaria</h2><p>Three.js · MIT. Kenney Food Kit · CC0, quando instalado. Personagens, cenários e música Web Audio originais do projeto.</p><p>Referências oficiais: Three.js Interactive Cubes e Skinning and Morphing. Nenhum arquivo Mixamo está incluído nesta versão.</p><a href="TECHNICAL-REFERENCES.md" target="_blank">Referências e licenças</a>');}
home();
${marker}`);
s=s.replace("function closeModal(){paused=false;", "function closeModal(){if(!started){home();return;}paused=false;");
s=s.replace("$('#close').classList.add('hidden');$('#start').onclick=startGame;", "$('#close').classList.add('hidden');$('#start').onclick=startGame;");
s=s.replace("$('#modal').classList.remove('hidden');$('#close').focus();", "$('#modal').classList.remove('hidden');if(!started)$('#close').classList.remove('hidden');$('#close').focus();");
s=s.replace("$('#resume').onclick=closeModal;", `$('#resume').onclick=closeModal;
const access=document.createElement('div');access.innerHTML='<h3>Acessibilidade</h3><label><input id="reduce-motion" type="checkbox"> Reduzir movimento</label><label><input id="particles" type="checkbox"> Partículas suaves</label><button id="reopen-tutorial">Reabrir tutorial</button>';$('#modalcontent').append(access);$('#reduce-motion').checked=motionReduced();$('#particles').checked=state.particles;$('#reduce-motion').onchange=e=>{state.reducedMotion=e.target.checked;document.body.classList.toggle('reduced-motion',motionReduced());save();};$('#particles').onchange=e=>{state.particles=e.target.checked;save();};$('#reopen-tutorial').onclick=()=>{if(!started){startGame();}else closeModal();startTutorial(true);};`);
s=s.replace("eventPaid=true;state.money+=20;", "eventPaid=true;recordCampaign('event');state.money+=20;");
s+=`\nfunction recordCampaign(event,data={}){const result=campaignEvent(state,event,data);if(!result)return;save();toast('✓ '+result.title+' · +R$ '+result.money+' · +'+result.xp+' XP');if(state.campaign.complete){rebuild();showModal(campaignMarkup(state)+'<button id="end-continue">Continuar minha pizzaria</button>');$('#end-continue').onclick=closeModal;}else if(currentContract(state).chapter!==result.chapter)showUnlock('Capítulo '+(currentContract(state).chapter+1),CHAPTERS[currentContract(state).chapter][2],'roberto');}
`;
// Additional controls are attached once, outside the periodically rebuilt HUD.
s+=`\nconst ordersToggle=document.createElement('button');ordersToggle.textContent='Trocar pedido';ordersToggle.onclick=()=>document.body.classList.toggle('all-orders');$('#orders').append(ordersToggle);
document.body.classList.toggle('reduced-motion',motionReduced());
addEventListener('keydown',e=>{if(e.key==='Tab'&&paused){const items=[...$('#modal').querySelectorAll('button:not([disabled]),input,select,a[href]')].filter(x=>!x.classList.contains('hidden'));const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
`;
// More vivid accents without recoloring every material.
s=s.replace('0x738e96,0xcfa950,0x997a9b,0x486e54,0xba6a49','0x299cab,0xe9b638,0x9c66b2,0x409268,0xd66c45');
s=s.replace("textSign('PIZZA EMPIRE',5.1,.85,'#315444','#ffe6a5'", "textSign('PIZZA EMPIRE',5.1,.85,'#923d2a','#ffe6a5'");
s=s.replace('function rebuild(){furniture.clear();',"function rebuild(){furniture.traverse(o=>{o.geometry?.dispose();if(o.material?.map){o.material.map.dispose();o.material.dispose();}});furniture.clear();");
s=s.replace('table(1,1.3);',"if(state.campaign.complete){cyl(.24,.4,0xf1bb36,1.7,1.4,-4.65,furniture);sphere(.26,0xf1bb36,1.7,1.75,-4.65,furniture);}table(1,1.3);");
write('game.js',s);
write('style.css',read('style.css')+`\n/* Campaign HUD: one order and one instruction at a time. */
#next-unlock,#orders>.hint,#tutorial-title,#tutorial-confirmation{display:none!important}
#orders .order:not(.selected){display:none}
.all-orders #orders .order{display:block}
#orders{max-height:44vh;overflow:auto}
#orders .order p{display:none}
#mission{max-width:250px}#mission>small{display:none}
#missiondesc{font-size:14px}#missionreward{font-size:12px}
#tutorial{top:auto!important;bottom:112px!important;left:20px!important;right:auto!important;width:230px!important;padding:10px!important}
#tutorial button{min-height:44px}#view-controls{display:none!important}
#audio-status{right:18px!important;bottom:90px!important}
body:not(.playing) header,body:not(.playing) aside,body:not(.playing) footer,body:not(.playing) #guide,body:not(.playing) #audio-status,body:not(.playing) #labels{visibility:hidden}
body:not(.playing) #modal{background:linear-gradient(90deg,rgba(21,40,36,.85),rgba(21,40,36,.05))}
body:not(.playing) #modalcontent h1{font-size:clamp(38px,6vw,70px);color:#b74229}
#modalcontent label{display:block;margin:14px 0}button:focus-visible,[tabindex]:focus-visible,a:focus-visible{outline:3px solid #168ba4;outline-offset:3px}
.reduced-motion *{animation:none!important;transition:none!important;scroll-behavior:auto!important}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
@media(max-width:700px){#orders{max-height:24vh!important;width:180px!important}#mission{display:block!important;position:fixed;right:8px;top:86px;width:150px;padding:10px!important}#missiondesc,#missionreward,#mission .track{display:none}#missiontitle{font-size:13px!important}#mission button{font-size:12px!important;min-height:44px}#tutorial{bottom:190px!important;left:8px!important;width:170px!important}#audio-status{bottom:140px!important;font-size:12px}#guide{max-width:calc(100vw - 24px)}.brand small,.controls,#xptext{display:none!important}}
`);
write('index.html',read('index.html').replace(',maximum-scale=1',''));
console.log('Integrated campaign, persistent tutorial, startup and accessibility.');

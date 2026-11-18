import fs from 'node:fs';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8'),write=(p,s)=>fs.writeFileSync(new URL(p,root),s);
let s=read('game.js');
// Intro uses the existing cast and scene, with no simulated paid orders.
s=s.replace("let introTime=0;", "let introTime=0;let introPizza=null,introGuest=null;");
s=s.replace("if(!started){introTime+=dt;if(!motionReduced())animatePerson(roberto,dt,false,true);}","if(!started){introTime+=dt;const t=motionReduced()?1:introTime;if(!motionReduced())animatePerson(roberto,dt,false,true);if(introPizza){introPizza.position.copy(roberto.g.position);introPizza.position.y=1.25+(!motionReduced()?Math.sin(t*1.6)*.12:0);introPizza.position.z+=.5;introPizza.rotation.y=motionReduced()?0:t*.5;}if(introGuest){introGuest.g.position.z=5-Math.min(t,5)*.27;animatePerson(introGuest,motionReduced()?0:dt,t<5);}}");
s=s.replace("music.unlock();started=true;closeModal();", "music.unlock();started=true;if(introPizza){disposeGroup(introPizza);introPizza=null;}if(introGuest){disposeGroup(introGuest.g);introGuest=null;}closeModal();");
s=s.replace("home();\nlet previous", "introPizza=pizza({stage:'raw',recipe:0,quality:1});scene.add(introPizza);introGuest=person(0x299cab,0xd99d70);introGuest.g.position.set(-.5,0,5);home();\nlet previous");
// Only selected and nearby labels stay expanded.
s=s.replace("l.el.style.display=v.z>1||v.z< -1?'none':'block';", "const stationId=l.el.dataset.station;const close=stationId&&Math.hypot(player.g.position.x-points[stationId].x,player.g.position.z-points[stationId].z)<2;const relevant=!stationId||stationId===guideStation||close;l.el.style.display=v.z>1||v.z< -1||!relevant?'none':'block';");
// Campaign upgrades owned earlier are recognized without a redundant purchase.
s=s.replace("if(uiClock>.35){renderUI();", "if(uiClock>.35){if(currentContract(state)?.event==='upgrade')recordCampaign('check');renderUI();");
s=s.replace("if(finished&&c.special)recordCampaign('special');", "if(finished&&c.special)recordCampaign('special');recordVisit(c,p,finished);");
s+=`\nfunction recordVisit(c,p,finished){state.history??=[];if(finished){const entry=state.history.find(x=>x.name===c.name);if(entry){entry.visits++;entry.recipe=p.recipe;}else state.history.push({name:c.name,visits:1,recipe:p.recipe});state.history=state.history.slice(-12);}}
`;
// Small appearance choices remain local and preserve all gameplay upgrades.
s=s.replace("function showMissions(){const next=nearestUnlock(state);showModal(", "function showMissions(){const next=nearestUnlock(state);showModal('<details><summary>Clientes do bairro</summary>'+((state.history||[]).map(c=>'<p>'+c.name+' · '+c.visits+' visita(s) · '+RECIPES[c.recipe].name+'</p>').join('')||'<p>Seu histórico aparece depois das primeiras entregas.</p>')+'</details>'+");
s=s.replace("const access=document.createElement('div');", "const access=document.createElement('div');");
s=s.replace("$('#particles').checked=state.particles;", "$('#particles').checked=state.particles;const palette=document.createElement('div');palette.innerHTML='<label>Detalhes do salão <select id=\"appearance\"><option value=\"classica\">Terracota clássica</option><option value=\"verde\">Jardim italiano</option><option value=\"azul\">Azulejos do mar</option></select></label>';access.append(palette);$('#appearance').value=state.appearance||'classica';$('#appearance').onchange=e=>{state.appearance=e.target.value;rebuild();save();};");
s=s.replace("table(1,1.3);", "for(let i=0;i<3;i++)box(.3,.035,.3,({classica:0xd95d3f,verde:0x45a675,azul:0x28a3b5}[state.appearance]||0xd95d3f),-6+i*.65,1.21,1.8,furniture);table(1,1.3);");
// Do not overqueue every hint; payment notices already take precedence.
s=s.replace("if(!notices.includes(t))notices.push(t)", "if(!notices.includes(t)&&notices.length<4)notices.push(t)");
write('game.js',s);
let c=read('core.js');c=c.replace("tutorialProgress:null,", "tutorialProgress:null,appearance:'classica',history:[],");c=c.replace("d.campaign=campaignState(s.campaign);", "d.campaign=campaignState(s.campaign);d.appearance=['classica','verde','azul'].includes(s.appearance)?s.appearance:'classica';d.history=Array.isArray(s.history)?s.history.filter(x=>typeof x.name==='string'&&/^[A-Za-zÀ-ÿ ]{1,24}$/.test(x.name)&&Number.isInteger(x.recipe)&&x.recipe>=0&&x.recipe<6).slice(-12).map(x=>({name:x.name,recipe:x.recipe,visits:Math.max(1,Math.min(999,Math.floor(Number(x.visits)||1)))})):[];");write('core.js',c);
// Test mocks follow UI additions, while the real logic still runs inside the VM.
let t=read('game-integration.test.mjs');t=t.replace("createElement:()=>({})", "createElement:()=>({append(){}})");t=t.replace("recordCampaign(){},advanceTutorial", "recordCampaign(){},recordVisit(){},advanceTutorial");write('game-integration.test.mjs',t);
write('style.css',read('style.css')+`\n#roberto-help{margin-top:8px;width:100%;background:#b4442f}#orders button{margin-top:10px;width:100%}#modal section{max-height:88dvh}#modalcontent details{margin-bottom:16px}#modalcontent summary{cursor:pointer;min-height:44px;padding:12px;background:#e1eee8;border-radius:10px}#modalcontent select{min-height:44px}#guide-detail{font-size:15px!important;line-height:1.4}#tutorial-progress{font-size:12px;letter-spacing:.5px}#inventory[hidden],#tutorial[hidden]{display:none!important}body:not(.playing) #touch{visibility:hidden}#orders{overscroll-behavior:contain}#missiontitle{font-size:17px}
@media(max-width:700px){#roberto-help{display:none}#mission{max-height:130px}#orders{top:86px!important;left:8px!important;padding:10px!important}#orders .order{padding:8px;margin-top:6px}#orders .order h4{font-size:13px}#orders .order small{font-size:11px}#orders button{font-size:12px;padding:8px;min-height:44px}}
`);
console.log('Intro, past upgrades, customer history and appearance integrated.');

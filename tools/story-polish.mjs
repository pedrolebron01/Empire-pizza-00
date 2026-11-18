import fs from 'node:fs';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8'),write=(p,s)=>fs.writeFileSync(new URL(p,root),s);
let s=read('game.js');
s=s.replace("if(state.campaign.complete){rebuild();showModal(campaignMarkup(state)+'<button id=\"end-continue\">Continuar minha pizzaria</button>');$('#end-continue').onclick=closeModal();}","if(state.campaign.complete){rebuild();}");
// Preserve legacy rewards; only the story services close the new main campaign.
const a=s.indexOf("if(state.campaign.complete){rebuild();showModal"),b=s.indexOf("else if(currentContract(state).chapter",a);
if(a>=0&&b>a)s=s.slice(0,a)+"if(state.campaign.complete){rebuild();showUnlock('Contratos do bairro concluídos','A campanha de serviços continua no Menu.','mission');}"+s.slice(b);
s=s.replace("function animatePerson(p,dt,moving,working=false){p.walk+=dt*(moving?11:2);p.legs.forEach((l,i)=>l.rotation.x=moving?Math.sin(p.walk+i*Math.PI)*.48:0);p.arms.forEach((a,i)=>a.rotation.x=working?-.9+Math.sin(p.walk*2)*.18:moving?Math.sin(p.walk+i*Math.PI+Math.PI)*.35:Math.sin(p.walk)*.025);}",`function animatePerson(p,dt,moving,working=false){p.walk+=dt*(moving?11:2);const blend=1-Math.exp(-dt*16),reduced=motionReduced();p.celebrate=Math.max(0,(p.celebrate||0)-dt);p.legs.forEach((l,i)=>{const target=moving?Math.sin(p.walk+i*Math.PI)*.42:0;l.rotation.x+=(target-l.rotation.x)*blend;});p.arms.forEach((a,i)=>{const target=p.celebrate>0&&!reduced?-1.7:working?-.9+Math.sin(p.walk*2)*.12:moving?Math.sin(p.walk+i*Math.PI+Math.PI)*.3:0;a.rotation.x+=(target-a.rotation.x)*blend;});}
`);
s=s.replace("sound('delivery');sound('cash'", "player.celebrate=.28;sound('delivery');sound('cash'");
s=s.replace("function showUnlock(title,detail,icon){", "function showUnlock(title,detail,icon){player.celebrate=.45;");
s=s.replace("if(result.chapter){rebuild();showStory();}", "if(result.chapter){rebuild();showStory();}");
s=s.replace("if(state.campaign.complete){cyl(.24", "if(state.campaign.complete||state.service.complete){cyl(.24");
// Sequence orders stay directed after existing clients leave; accepted deliveries identify the story.
s=s.replace("$('#hud-action').textContent=$('#guide-title').textContent;", "$('#hud-action').textContent=$('#guide-title').textContent;if(state.service.active&&sp&&hand.length===0&&!ovens.length&&!work)$('#hud-action').textContent='Prepare '+RECIPES[sp.recipe].name+' para esta rodada.';");
s=s.replace("const hint=result.hint.replace", "const hint=result.hint.replace");
s=s.replace("$('#home-help').onclick=showHelp;", "$('#home-help').onclick=showHelp;");
write('game.js',s);
// Give every service a concrete place in the neighborhood story.
let c=read('service.js');const marker='export const SERVICES=';
const stories=[
 ['A mesa da Sofia','Primeira degustação','Aniversário da Lia','Lanche na praça','A primeira parceria','A primeira noite cheia'],
 ['A coluna do Miguel','Três sabores do bairro','O almoço de domingo','Caixas para a oficina','A rota do forno','A visita da escola'],
 ['O uniforme do Roberto','Treino de qualidade','A mesa da equipe','A viagem da bandeja','Dupla de forno','A festa dos vizinhos'],
 ['O mapa dos sabores','Prova dos queijos','A família da Lia','Entrega na estação','Despensa e equipe','Sabores da cidade'],
 ['A reserva da Clara','A noite dos críticos','A grande mesa','As caixas do teatro','O salão e a cozinha','A casa em movimento'],
 ['Festival: abertura','Festival: degustação','Festival: famílias','Festival: praça','Festival: equipe','Festival: a grande final']
];
c=c.replace(marker,'const TITLES='+JSON.stringify(stories)+';\n'+marker);
c=c.replace('title:t[0],host:', 'title:TITLES[c][i],host:');
c=c.replace("seconds:Math.max(0,Number(raw?.seconds)||0)","seconds:Number.isFinite(raw?.seconds)?Math.max(0,Math.min(1e8,raw.seconds)):0");
write('service.js',c);
console.log('Story titles, character transitions and campaign finale polished.');

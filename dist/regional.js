import {casas} from './casas.js';

const kitchen=[
 ['Figueira assada','Figo · ricota · mel',0x9b4558,'Ricota da horta','Ricota · tomate · hortelã',0x55a359],
 ['Pera das Videiras','Pera · gorgonzola · nozes',0xdacd75,'Cogumelos ao alho','Cogumelos · alho · alecrim',0x875737],
 ['Pimenta de néon','Pimentão · milho · páprica',0xe05932,'Cebola da madrugada','Cebola roxa · cheddar · cebolinha',0xaa4e98],
 ['Maré verde','Abobrinha · limão · salsa',0x6ea04d,'Camarão da varanda','Camarão · tomate · coentro',0xe47856],
 ['Pinhão da serra','Pinhão · provolone · orégano',0x925332,'Abóbora do chalé','Abóbora · sálvia · parmesão',0xe78b36],
 ['Palmito da praça','Palmito · ervilha · azeitona',0xdfbf90,'Brasa executiva','Pastrami · mostarda · picles',0xae5248],
 ['Sol do festival','Milho · pimenta doce · queijo coalho',0xe5af38,'Doce despedida','Banana · canela · chocolate',0xb78247]
];
export const REGIONAL_RECIPES=kitchen.flatMap((row,house)=>[0,1].map(second=>({
 name:row[second*3],ingredients:row[second*3+1],color:row[second*3+2],level:1,
 price:45+house*5+second*4,house,second:!!second
})));
const titles=[
 ['Mesa da figueira','Feira de sábado','Visita da professora','Festa no quintal','Piquenique do coral','A galera do cinema','Aniversário da rua'],
 ['Vindima das famílias','La tavola lunga','O caderno da nonna','Concurso de ervas','A reserva do tenor','Sábado dos músicos','Festa da colheita'],
 ['Sessão das dez','Batalha de DJs','Mesa da redação','Varanda do estúdio','Último metrô','Plantão da rádio','Luzes da avenida'],
 ['Almoço das jangadas','Circuito de surfe','Reunião do farol','Mesa dos mergulhadores','Regata da baía','Pôr do sol no cais','Baile da orla'],
 ['Caminho dos guias','Rali do pinhão','Clube de astronomia','Jardim das araucárias','Ceia do abrigo','Encontro dos trilheiros','Serenata na serra'],
 ['Pausa da redação','Companhia de dança','Almoço de negócios','Horta comunitária','Camarim do teatro','Feira do livro','Noite de estreia'],
 ['Abertura da arena','Estafeta dos bairros','Mesa da comissão','Palco das ervas','Bastidores do show','Última eliminatória','Jantar das sete casas']
];
const rules=[
 {id:'point',text:'Degustação. Todas as pizzas precisam sair no ponto.'},
 {id:'quick',text:'Intervalo curto. Entregue antes de metade da paciência.'},
 {id:'office',text:'Reserva de grupo. Confira a ficha no escritório do mezanino antes de abrir a mesa.'},
 {id:'garden',text:'Menu de estação. Escolha um ramo de ervas na horta do terraço antes do serviço.'},
 {id:'counter',text:'Viagem. Separe cada pizza pronta no balcão e entregue dali.'},
 {id:'helper',text:'Equipe de forno. Roberto precisa transportar uma das pizzas em cada rodada.'},
 {id:'final',text:'Final em dois atos. Entregue a primeira rodada no ponto e a segunda pelo balcão.'}
];
const stamp=(house,stage)=>house*7+stage;
export const CIRCUIT=casas.flatMap((c,house)=>titles[house].map((name,stage)=>({
 id:stamp(house,stage),house,stage,name,host:c.host,rule:rules[stage],
 size:4+Math.floor((house+stage)/4),cash:65+house*12+stage*6,xp:32+stage*3
})));
const nat=(v,max)=>Number.isInteger(v)&&v>=0?Math.min(v,max):0;
export function restoreCircuit(raw){
 const progress={};
 for(const job of CIRCUIT){
   const p=raw?.progress?.[job.id];
   if(!p||typeof p!=='object')continue;
   progress[job.id]={portions:nat(p.portions,job.size*2),choice:p.choice===1?1:0,
     signed:p.signed===true,assisted:p.assisted===true};
 }
 const candidate=raw?.active;
 return {active:Number.isInteger(candidate)&&CIRCUIT[candidate]&&progress[candidate]?.portions<CIRCUIT[candidate].size*2?candidate:null,progress};
}
export function finishedCircuit(state,job){return state.circuit.progress[job.id]?.portions===job.size*2;}
export function regionalOpen(state,id){
 const r=REGIONAL_RECIPES[id-6];
 return !!r&&state.served>=Math.max(3,casas[r.house].at)&&(!r.second||finishedCircuit(state,CIRCUIT[stamp(r.house,1)]));
}
export function availableJob(state,j){
 return !!j&&state.served>=Math.max(3,casas[j.house].at)&&(!j.stage||finishedCircuit(state,CIRCUIT[j.id-1]));
}
export function beginCircuit(state,job,choice){
 if(!availableJob(state,job)||finishedCircuit(state,job)||job.house!==state.casa||job.stage===5&&!state.upgrades.helper)return false;
 state.circuit.progress[job.id]??={portions:0,signed:false,assisted:false,choice:choice===1?1:0};
 state.circuit.active=job.id;state.service.active=false;state.office.active=false;state.shopOpen=true;return true;
}
export function circuitTask(state){
 const j=CIRCUIT[state.circuit.active];
 if(!j||j.house!==state.casa)return null;
 const p=state.circuit.progress[j.id];
 if(!p)return null;
 const regional=6+2*j.house,other=j.stage>=2?regional+1:0;
 const round=Math.floor(p.portions/j.size),within=p.portions%j.size;
 // Two tasting menus offer different prep/stock decisions. The first two
 // reservations work even when the house has just a single regional recipe.
 const menu=p.choice===1?[regional,other,regional,regional,other]:[other,regional,other,regional,regional];
 const recipe=menu[(within+round+j.stage)%menu.length];
 const desk=j.stage===2?1:j.stage===3?2:0;
 return {j,p,recipe,round,desk,waiting:!!desk&&!p.signed};
}
export function signCircuit(state,floor){
 const t=circuitTask(state);
 if(!t?.waiting||t.desk!==floor)return false;
 t.p.signed=true;return true;
}
export function circuitDelivery(state,{id,recipe,quality,fast,shelf}){
 const t=circuitTask(state);
 if(!t||id!==t.j.id||t.waiting||recipe!==t.recipe)return '';
 const {j,p,round}=t,mode=j.rule.id;
 if((mode==='point'||mode==='final'&&!round)&&quality<1)return 'A degustação pede uma nova porção no ponto.';
 if(mode==='quick'&&!fast)return 'O grupo do intervalo pediu uma nova caixa rápida.';
 if((mode==='counter'||mode==='final'&&round)&&!shelf)return 'Na próxima retirada, guarde a pizza no balcão antes de servir.';
 if(mode==='helper'&&(p.portions+1)%j.size===0&&!p.assisted)return 'Deixe Roberto levar uma fornada ao balcão para fechar a rodada.';
 p.portions++;
 if(p.portions===j.size)p.assisted=false;
 if(p.portions<j.size*2)return j.name+' · '+p.portions+'/'+(j.size*2)+' porções.';
 state.money+=j.cash;state.xp+=j.xp;state.circuit.active=null;
 return j.name+' concluída! R$ '+j.cash+' e '+j.xp+' XP.';
}
export function showCircuit({state,recipes,show,save,back,begin,changeHouse},house=state.casa){
 const c=casas[house],jobs=CIRCUIT.filter(j=>j.house===house),completed=jobs.filter(j=>finishedCircuit(state,j)).length;
 const t=circuitTask(state);
 show(`<span class="eyebrow">CAMPANHA REGIONAL</span><h2>Volta das Sete Casas</h2><p>${CIRCUIT.filter(j=>finishedCircuit(state,j)).length}/49 reservas · Progresso independente em cada casa.</p><label>Restaurante <select id="tour-house">${casas.map((x,i)=>'<option value="'+i+'" '+(i===house?'selected':'')+'>'+x.name+'</option>').join('')}</select></label><h3>${c.name} · ${completed}/7</h3><p>${recipes[6+house*2].name} e ${recipes[7+house*2].name}. A segunda receita é prêmio da segunda reserva. Estimativa de 22–45 min para esta casa, conforme o ritmo e a equipe.</p>${jobs.map(j=>{
   const p=state.circuit.progress[j.id],done=finishedCircuit(state,j),eligible=availableJob(state,j),helper=j.stage===5&&!state.upgrades.helper;
   if(!eligible||done)return '<p>'+(done?'✓ ':'▣ ')+j.name+'</p>';
   return `<article class="card"><h3>${j.name}</h3><p>${j.host} · ${j.rule.text}</p><p>${p?.portions||0}/${j.size*2} porções em duas rodadas. Prêmio de R$ ${j.cash} e ${j.xp} XP.</p>${p?'':'<label>Menu combinado <select id="tour-choice"><option value="0">Degustação equilibrada</option><option value="1">Mais especialidades regionais</option></select></label>'}<button data-tour="${j.id}" ${helper?'disabled':''}>${helper?'Contrate Roberto em Melhorias':p?'Retomar reserva':'Abrir reserva'}</button></article>`;
 }).join('')}${state.served<Math.max(3,c.at)?'<p>Esta casa recebe o circuito após '+Math.max(3,c.at)+' entregas.</p>':''}${t?'<p>Em andamento · '+t.j.name+' · '+(t.waiting?'Visite '+(t.desk===1?'o escritório':'a horta'):recipes[t.recipe].name)+'</p><button id="tour-stop">Suspender circuito</button>':''}<button id="tour-back">Voltar</button>`);
 document.querySelector('#tour-back').onclick=back;
 document.querySelector('#tour-house').onchange=e=>showCircuit({state,recipes,show,save,back,begin,changeHouse},Number(e.target.value));
 const stop=document.querySelector('#tour-stop');
 if(stop)stop.onclick=()=>{state.circuit.active=null;save();back();};
 document.querySelectorAll('[data-tour]').forEach(b=>b.onclick=()=>{
   const job=CIRCUIT[Number(b.dataset.tour)];if(!availableJob(state,job))return;
   changeHouse(house);
   if(beginCircuit(state,job,Number(document.querySelector('#tour-choice')?.value)))begin();
 });
}

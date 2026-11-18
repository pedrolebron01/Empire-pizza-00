// Story services: authored order waves, distinct rules, no minimum-time gates.
// 36 services × 4 waves × 5–6 pizzas = 816 directed pizzas plus management goals.
export const STORY_CHAPTERS=[
 {name:'As primeiras fornadas',minutes:40,recipes:[0],story:'Sofia trouxe os vizinhos. Vamos conquistar a primeira mesa.'},
 {name:'A casa ganha fama',minutes:45,recipes:[0,1,2],story:'Miguel escreve sobre a casa. Cada cliente agora tem seu favorito.'},
 {name:'Uma equipe de verdade',minutes:45,recipes:[0,1,2],story:'Roberto assume o transporte. Combine suas fornadas com as viagens dele.'},
 {name:'Os sabores da cidade',minutes:50,recipes:[1,2,3,4],story:'Lia organiza encontros do bairro. A despensa e os pedidos em dupla entram em cena.'},
 {name:'O salão cheio',minutes:50,recipes:[0,2,3,4,5],story:'Clara reservou o salão. Organize balcão, equipe e pedidos prioritários.'},
 {name:'O festival da pizza',minutes:50,recipes:[0,1,2,3,4,5],story:'O bairro inteiro vem provar a casa. Cada rodada celebra um sabor aprendido.'}
];
const THEMES=[
 ['Mesa dos vizinhos','Sofia','Os vizinhos pedem sabores em uma ordem combinada.','sequence'],
 ['Degustação guiada','Miguel','Uma rodada de sabores diferentes, com todas as pizzas no ponto.','quality'],
 ['Encontro em família','Lia','Pedidos em dupla: prepare a segunda pizza antes de encerrar a mesa.','family'],
 ['Caixas para a praça','Davi','Guarde as pizzas no balcão e organize as retiradas.','counter'],
 ['A cozinha em equipe','Clara','Combine montagem, forno e transporte.','team'],
 ['A noite da casa','Bento','O último serviço do capítulo reúne prioridades e receitas anteriores.','priority']
];
const TITLES=[["A mesa da Sofia","Primeira degustação","Aniversário da Lia","Lanche na praça","A primeira parceria","A primeira noite cheia"],["A coluna do Miguel","Três sabores do bairro","O almoço de domingo","Caixas para a oficina","A rota do forno","A visita da escola"],["O uniforme do Roberto","Treino de qualidade","A mesa da equipe","A viagem da bandeja","Dupla de forno","A festa dos vizinhos"],["O mapa dos sabores","Prova dos queijos","A família da Lia","Entrega na estação","Despensa e equipe","Sabores da cidade"],["A reserva da Clara","A noite dos críticos","A grande mesa","As caixas do teatro","O salão e a cozinha","A casa em movimento"],["Festival: abertura","Festival: degustação","Festival: famílias","Festival: praça","Festival: equipe","Festival: a grande final"]];
export const SERVICES=STORY_CHAPTERS.flatMap((ch,c)=>THEMES.map((t,i)=>({
 id:c*6+i,chapter:c,title:TITLES[c][i],host:t[1],text:t[2],mode:t[3],size:c<2?5:6,
 waves:Array.from({length:4},(_,w)=>Array.from({length:c<2?5:6},(_,p)=>ch.recipes[(p+w+i)%ch.recipes.length])),
 money:60+c*25,requires:i===4&&c>=2?'helper':i===3?'counter':null
})));
const count=v=>Number.isFinite(v)?Math.max(0,Math.min(1e7,Math.floor(v))):0;
export function restoreService(raw){return {index:Math.min(SERVICES.length,count(raw?.index)),wave:Math.min(3,count(raw?.wave)),served:Math.min(6,count(raw?.served)),stored:count(raw?.stored),helped:count(raw?.helped),active:false,complete:count(raw?.index)>=SERVICES.length,seconds:Number.isFinite(raw?.seconds)?Math.max(0,Math.min(1e8,raw.seconds)):0,failures:count(raw?.failures)};}
export function currentService(s){return SERVICES[s.service.index];}
export function startService(s){const t=currentService(s);if(!t)return false;s.service.active=true;return true;}
export function serviceOrder(s,serial){const p=s.service,t=currentService(s);if(!p.active||!t)return null;const list=t.waves[p.wave],recipe=list[(p.served+serial)%list.length];return {recipe,qty:t.mode==='family'?2:1,priority:t.mode==='priority'&&serial%2===0,host:t.host};}
export function recordService(s,event,data={}){
 const p=s.service,t=currentService(s);if(!p.active||!t)return null;
 if(event==='store')p.stored++;
 if(event==='helperDrop')p.helped++;
 if(event!=='delivery')return null;
 const required=t.waves[p.wave][p.served];
 if(t.mode==='sequence'&&data.recipe!==required)return {hint:'Nesta rodada, o próximo sabor é '+required};
 if(t.mode==='quality'&&data.quality<1){p.failures++;return {hint:'A degustação pede pizza no ponto. Refaça esta porção; as anteriores continuam valendo.'};}
 if(t.mode==='counter'&&data.source!=='shelf')return {hint:'Na retirada da praça, entregue uma pizza guardada no Balcão.'};
 if(t.requires==='helper'&&p.helped<1)return {hint:'Deixe Roberto trazer uma fornada ao Balcão antes de encerrar esta rodada.'};
 p.served++;
 if(p.served<t.size)return {progress:true};
 p.served=0;p.stored=0;p.helped=0;
 if(p.wave<3){p.wave++;return {wave:true};}
 p.wave=0;p.index++;p.active=false;p.complete=p.index===SERVICES.length;s.money+=t.money;s.xp+=30+t.chapter*5;
 if(p.complete)s.money+=750;
 return {finished:true,chapter:p.index%6===0,service:t,complete:p.complete};
}
export function serviceProgress(s){const p=s.service,t=currentService(s);return t?{title:t.title,chapter:STORY_CHAPTERS[t.chapter].name,count:p.wave*t.size+p.served,goal:4*t.size,recipe:t.waves[p.wave][p.served],next:SERVICES[p.index+1]?.title||'Troféu do festival'}:null;}

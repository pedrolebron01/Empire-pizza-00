// Campaign progress is independent of transient orders. A contract pays exactly once.
export const CHAPTERS = [
 ['As primeiras fornadas',35,'Uma pizza bem feita é o começo de tudo.'],
 ['A casa ganha fama',40,'O bairro está falando da nossa cozinha!'],
 ['Uma equipe de verdade',40,'Eu cuido do forno ao balcão. Você cuida dos clientes.'],
 ['Os sabores da cidade',45,'Cada família traz uma história e um novo sabor.'],
 ['O salão cheio',45,'Casa cheia pede organização, não pressa.'],
 ['O festival da pizza',45,'Vamos mostrar à cidade tudo o que aprendemos.']
];
const job=(title,event,goal,extra={})=>({title,event,goal,...extra});
export const CONTRACTS = CHAPTERS.flatMap((c,ch)=>{
 const flavors=[0,1,2,3,4,5].slice(0,Math.min(6,ch+1));
 const tasks=[
  job('Converse com Roberto sobre este capítulo','roberto',1),
  job('Atenda os vizinhos com capricho','delivery',6+ch*2,{quality:true}),
  ...flavors.map(recipe=>job('Rodada de '+['Muçarela','Calabresa','Marguerita','Frango com catupiry','Quatro queijos','Especial da casa'][recipe],'delivery',4+ch,{recipe})),
  job('Quentinhas na mesa','delivery',5+ch,{fast:true}),
  job('Invista na casa','upgrade',1,{upgrade:['bench','oven','helper','tray','expand','decor'][ch],tier:ch===5?3:1}),
  job('Uma sequência de confiança','streak',4+ch),
  job(ch<2?'Pedido de honra':'Famílias e visitantes','special',2+ch),
  job(ch<2?'O balcão organizado':'Trabalho em equipe',ch<2?'store':'helperDrop',ch<2?3:5+ch),
  job(ch<3?'Serviço completo':'Despensa abastecida',ch<3?'delivery':'restock',ch<3?8:2),
  job('Variedade no cardápio','variety',Math.min(6,ch+1)),
  job('Gorjetas conquistadas','tips',80+ch*40),
  job('Desafio do movimento','event',1+Math.floor(ch/2)),
  job('Última rodada do capítulo','delivery',10+ch*2,{quality:true})
 ];
 return tasks.map((t,i)=>({...t,chapter:ch,id:`${ch}:${i}`,money:25+ch*10,xp:10+ch*5}));
});
export function campaignState(raw){const n=v=>Math.max(0,Math.min(1e8,Number(v)||0));return {index:Math.min(CONTRACTS.length,Math.floor(n(raw?.index))),count:n(raw?.count),recipes:Array.isArray(raw?.recipes)?[...new Set(raw.recipes.filter(x=>Number.isInteger(x)&&x>=0&&x<6))]:[],seconds:n(raw?.seconds),complete:Math.floor(n(raw?.index))>=CONTRACTS.length};}
export function currentContract(s){return CONTRACTS[s.campaign.index];}
export function campaignEvent(s,event,data={}){
 const c=s.campaign,t=currentContract(s);if(!t)return null;
 if(t.event==='upgrade'){c.count=s.upgrades[t.upgrade]>=t.tier?1:0;}
 else if(t.event==='variety'&&event==='delivery'){if(!c.recipes.includes(data.recipe))c.recipes.push(data.recipe);c.count=c.recipes.length;}
 else if(t.event==='streak'&&event==='delivery')c.count=data.streak||0;
 else if(t.event===event&&(!t.quality||data.quality>=1)&&(!t.fast||data.fast)&&(t.recipe===undefined||t.recipe===data.recipe))c.count+=data.amount??1;
 if(c.count<t.goal)return null;
 s.money+=t.money;s.xp+=t.xp;c.index++;c.count=0;c.recipes=[];
 if(c.index===CONTRACTS.length){c.complete=true;s.money+=500;}
 return t;
}
export function campaignMarkup(s){const t=currentContract(s),c=s.campaign;if(!t)return `<h2>O festival é nosso!</h2><p>Campanha concluída · ${Math.floor(c.seconds/60)} minutos ativos · ${s.served} pizzas servidas.</p><p>Recompensa permanente: troféu da casa e +10% nas gorjetas. Continue com metas diárias, VIPs, eventos e recordes de sequência.</p>`;const chapter=CHAPTERS[t.chapter];return `<h2>${t.chapter+1} · ${chapter[0]}</h2><p>Roberto: “${chapter[2]}”</p><h3>${t.title}</h3><p>${Math.min(c.count,t.goal)} / ${t.goal} · +R$ ${t.money} · +${t.xp} XP</p><p>Próximo marco: ${CONTRACTS[c.index+1]?.title||'Troféu do festival'}</p><small>Contrato ${c.index+1} de ${CONTRACTS.length} · ${Math.floor(c.seconds/60)} minutos jogados</small>`;}

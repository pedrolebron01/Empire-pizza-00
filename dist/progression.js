import {RECIPES, UPGRADES, level, cost} from './core.js';
export const DAILY_GOALS=[
  {key:'served',goal:5,title:'Cinco motivos para sorrir',desc:'Entregue 5 pizzas corretas.',money:25,xp:15},
  {key:'fast',goal:3,title:'Quentinhas na mesa',desc:'Faça 3 entregas antes de metade da paciência acabar.',money:20,xp:15},
  {key:'special',goal:1,title:'Cliente de honra',desc:'Complete um pedido especial.',money:30,xp:20}
];
export function dayKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function ensureDaily(state,date=new Date()){
  const day=dayKey(date);
  if(state.daily?.day!==day)state.daily={day,served:0,fast:0,special:0,claimed:[]};
  return state.daily;
}
export function recordDaily(state,{fast=false,special=false},date=new Date()){
  const d=ensureDaily(state,date);d.served++;if(fast)d.fast++;if(special)d.special++;
  const result=[];
  DAILY_GOALS.forEach((g,i)=>{if(d[g.key]>=g.goal&&!d.claimed.includes(i)){d.claimed.push(i);state.money+=g.money;state.xp+=g.xp;result.push(g);}});
  return result;
}
export function nearestUnlock(state){
  const next=RECIPES.find(r=>r.level>level(state));
  const candidates=Object.keys(UPGRADES).filter(k=>state.upgrades[k]<UPGRADES[k].max&&(k!=='helper'||state.served>=3)).sort((a,b)=>cost(state,a)-cost(state,b));
  const key=candidates[0];
  return {recipe:next?`${next.name}: faltam ${(next.level-1)*100-state.xp} XP`:'Todas as receitas liberadas!',upgrade:key?`${UPGRADES[key].name}: ${state.money>=cost(state,key)?'já pode comprar':'faltam R$ '+(cost(state,key)-state.money)}`:'Todas as melhorias concluídas!',key,expansion:state.upgrades.expand?'Novo salão aberto!':`Novo salão: ${state.money>=cost(state,'expand')?'já pode abrir':'faltam R$ '+(cost(state,'expand')-state.money)}`};
}
export function specialCustomer(served,serial){
  if(served<3||serial%4!==0)return null;
  return serial%8===0?{name:'Crítico gastronômico',qty:1,patience:150,money:25,xp:25,kind:'critic'}:{name:'Família do bairro',qty:2,patience:240,money:18,xp:15,kind:'family'};
}
export function specialBonus(special,perfect){return special&& (special.kind!=='critic'||perfect)?{money:special.money,xp:special.xp}:null;}
export function comboBonus(count){return count===3?{money:5,xp:3}:count===5?{money:10,xp:5}:null;}
export function eventAt(time){const cycle=Math.floor(time/180),elapsed=time%180;return {id:cycle,type:cycle%2?'festival':'rush',name:cycle%2?'Festival de sabores':'Horário de pico',warning:elapsed>=135&&elapsed<150,active:elapsed>=150,remaining:Math.ceil((elapsed<150?150:180)-elapsed),goal:2};}

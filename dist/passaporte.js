import {casas} from './casas.js';

export function restoreStamps(raw){
  return Array.isArray(raw)?[...new Set(raw.filter(id=>Number.isInteger(id)&&id>=0&&id<casas.length))]:[];
}
export function stampRecipe(house){return house===0?0:6+2*house}
export function stampReward(house){return 35+house*10}
export function awardStamp(state,pizza){
  const house=state.casa;
  if(!pizza.artisan||pizza.quality<1||pizza.recipe!==stampRecipe(house)||state.stamps.includes(house))return 0;
  const bonus=stampReward(house);
  state.stamps.push(house);state.money+=bonus;
  return bonus;
}
export function travelMap(state,recipes){
  const count=state.stamps.length;
  return '<div class="travel-map"><span class="eyebrow">Passaporte do pizzaiolo</span><h2>Mapa dos restaurantes</h2><p>'+count+' de '+casas.length+' carimbos. Em cada casa, entregue o sabor indicado, montado à mão sem erros e assado no ponto.</p><div class="travel-grid">'+casas.map((c,i)=>{
    const current=i===state.casa,locked=state.served<c.at,stamped=state.stamps.includes(i);
    return `<article class="travel-card"><div aria-hidden="true" class="district-art" style="background-position:${i%2*100}% ${Math.floor(i/2)*100/3}%"></div><div class="travel-copy"><h3>${c.name}</h3><p>${c.detail}</p><p><strong>${stamped?'✓ Carimbo conquistado':recipes[stampRecipe(i)].name+' · prêmio R$ '+stampReward(i)}</strong></p><button data-casa="${i}" ${current||locked?'disabled':''}>${current?'Casa atual':locked?'Abre com '+c.at+' entregas':'Abrir nesta casa'}</button></div></article>`;
  }).join('')+'</div></div>';
}

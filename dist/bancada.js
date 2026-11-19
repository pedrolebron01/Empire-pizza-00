import {RECIPES} from './core.js';

const colors = {
  molho:'#c53720', muçarela:'#fff2bb', queijos:'#fff0a1', calabresa:'#b4432e',
  tomate:'#ed5238', manjericão:'#348145', frango:'#dd9d58', catupiry:'#fff5d5',
  provolone:'#e9b44f', parmesão:'#ffe09a', gorgonzola:'#c6ccb4', figo:'#943f56',
  ricota:'#fff5e7', mel:'#dda020', hortelã:'#48804f', pera:'#c3cb73', nozes:'#85543e',
  cogumelos:'#ae8164', alho:'#f5e5b2', alecrim:'#307949', pimentão:'#c75a26',
  milho:'#fbc637', páprica:'#a84422', 'cebola roxa':'#a45199', cheddar:'#eda425',
  cebolinha:'#37844b', abobrinha:'#8caf4d', limão:'#bedf57', salsa:'#528a51',
  camarão:'#ed9068', coentro:'#327f40', pinhão:'#9b6345', orégano:'#637837',
  abóbora:'#eb8c34', sálvia:'#70916a', palmito:'#fff4cc', ervilha:'#80a244',
  azeitona:'#463e37', pastrami:'#a34e48', mostarda:'#d3a028', picles:'#7d9949',
  'pimenta doce':'#cf4d32','queijo coalho':'#ffe3a0', banana:'#f5da82',
  canela:'#a5683a', chocolate:'#714535'
};
const herbs = new Set(['manjericão','hortelã','alecrim','cebolinha','salsa','coentro','orégano','sálvia']);
const discs = new Set(['calabresa','tomate','abobrinha','azeitona','picles','banana','figo']);
function topping(name,layer){
  const color=colors[name] || '#dbb882';
  if(name==='molho')return '<circle cx="80" cy="79" r="57" fill="#cc492a"/>';
  const shape=herbs.has(name)?'<path d="M-8 5Q-9-8 9-6Q10 6-8 5Z"/><path d="M-6 3L7-4" stroke="#fff" opacity=".42"/>':
    discs.has(name)?'<circle r="7"/><circle cx="-2" cy="-2" r="2" fill="#fff" opacity=".4"/>':
    '<path d="M-7-3L2-5L7 0L4 5L-5 4Z"/><path d="M-4-2L1-3" stroke="#fff" opacity=".55"/>';
  return Array.from({length:9},(_,i)=>{
    const angle=i*2.4+layer*1.7, radius=12+35*Math.sqrt(i/8);
    return '<g transform="translate('+(80+Math.cos(angle)*radius).toFixed(1)+' '+(79+Math.sin(angle)*radius).toFixed(1)+') rotate('+Math.round(angle*32)+')" fill="'+color+'" stroke="#623d27" stroke-width=".7">'+shape+'</g>';
  }).join('');
}
export function ingredients(id){return RECIPES[id].ingredients.toLowerCase().split(' · ')}
export function pizzaDrawing(parts){
  return '<svg class="pizza-drawing" viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="84" r="72" fill="#764932"/><circle cx="80" cy="79" r="69" fill="#de8c43" stroke="#633f2c" stroke-width="3"/><circle cx="80" cy="79" r="63" fill="#f6c36b"/><circle cx="80" cy="79" r="57" fill="#efb751"/>'+parts.map(topping).join('')+'</svg>';
}

export function handFinish(id,{show,back,finish,effect}){
  const parts=ingredients(id), placed=[];
  let perfect=true;
  const options=[...new Set([...parts,'tomate','manjericão','muçarela'])].sort((a,b)=>a.localeCompare(b,'pt'));
  function draw(message=''){
    const done=placed.length===parts.length;
    show(`<div class="prep-sheet"><span class="eyebrow">Bancada artesanal</span><h2>${RECIPES[id].name}</h2>
      <div class="prep-board">${pizzaDrawing(placed)}</div>
      <p aria-live="polite">${message} ${done?'Pizza montada.':('Camada '+(placed.length+1)+' de '+parts.length+' · Acrescente <strong>'+parts[placed.length]+'</strong>.')}</p>
      <div class="prep-pantry">${done?'<button id="finish-hand">Levar à bandeja</button>':options.map(n=>'<button data-topping="'+n+'"><i style="background:'+colors[n]+'"></i>'+n+'</button>').join('')}</div>
      <small>${perfect?'Sequência sem erros vale R$ 6 extras na entrega.':'A receita continua valendo seu preço normal.'}</small><button id="back-hand">Voltar às receitas</button></div>`);
    document.querySelectorAll('[data-topping]').forEach(b=>b.onclick=()=>{
      if(b.dataset.topping!==parts[placed.length]){perfect=false;effect('wrong');draw('Confira a ficha.');return}
      placed.push(b.dataset.topping);effect('ingredient');draw();
    });
    document.getElementById('back-hand').onclick=back;
    if(done)document.getElementById('finish-hand').onclick=()=>finish(perfect);
    const next=document.querySelector(done?'#finish-hand':'[data-topping]');next?.focus();
  }
  draw();
}

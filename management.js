export const TEAM = {
  cleaner: {name:"Zilda",job:"Limpeza do salão",intro:"Deixe as mesas comigo. Sempre cabe mais um!",at:4,costs:[55,90,130],describe:n=>"Libera a próxima mesa "+(2*n)+" segundos mais cedo após a saída de cada cliente."},
  cook: {name:'Jana', job:'Bancada', intro:'Se há comanda na fila, já deixo a próxima massa aberta.', at:6, costs:[75,110,150], describe:n=>'Monta uma pizza dos três sabores básicos para uma comanda em '+(16-3*n)+' s. Retire na bancada com a bandeja livre.'},
  courier: {name:'Zeca', job:'Retirada', intro:'Conheço a freguesia pelo nome que vai escrito na caixa.', at:12, costs:[95,125,160], describe:n=>'Leva a pizza do balcão ao cliente das encomendas do caderno. Velocidade de '+(1.6+.4*n).toFixed(1)+' m/s.'},
  host: {name:'Malu', job:'Recepção', intro:'Guardo um lugar à sombra para quem espera.', at:3, costs:[55,85,120], describe:n=>'Recebe cada mesa na entrada e oferece '+(12*n)+' segundos extras de paciência.'},
  buyer: {name:'Cícero', job:'Compras', intro:'O fornecedor separa sua caixa assim que eu confirmo o pedido.', at:10, costs:[95,130,180], describe:n=>'Negocia '+(8+n*2)+' porções especiais por R$ 24 a cada compra na despensa.'}
};

// Each client orders a tasting box for collection. A stamp is earned per pizza.
export const BOOKINGS = [
  {title:'Piquenique da praça', client:'Alice', at:3, recipes:[0,0,1], rule:'shelf', goal:'Entregue pelo balcão de apoio.', reward:45},
  {title:'Ensaio da banda', client:'Tomás', at:8, recipes:[1,0,2], rule:'fast', goal:'Sirva antes de metade da paciência de cada músico.', reward:60},
  {title:'Recepção do museu', client:'Cora', at:15, recipes:[2,1,2,0], rule:'point', goal:'Sirva todas as fatias no ponto.', reward:85},
  {title:'Almoço no cais', client:'Íris', at:22, recipes:[3,2,1,3], rule:'shelf', goal:'Separe no balcão as caixas da tripulação.', reward:100},
  {title:'Ceia do chalé', client:'Noé', at:32, recipes:[4,3,2,4,1], rule:'point', goal:'Mantenha a qualidade das cinco fornadas.', reward:135},
  {title:'Conselho da cidade', client:'Lena', at:45, recipes:[5,3,4,2,5], rule:'fast', goal:'Sirva a reunião antes de metade da paciência.', reward:155},
  {title:'Júri do festival', client:'Inês', at:60, recipes:[2,3,1,4,5,0], rule:'point', goal:'Entregue os seis sabores no ponto.', reward:200}
];
function integer(value,max,otherwise=0){return Number.isInteger(value)&&value>=0?Math.min(value,max):otherwise;}
export function restoreOffice(value){
 const page=integer(value?.page,BOOKINGS.length);
 return {cleaner:integer(value?.cleaner,3),cook:integer(value?.cook,3),courier:integer(value?.courier,3),cup:{active:value?.cup?.active===true,score:integer(value?.cup?.score,9999),
   played:integer(value?.cup?.played,11),best:integer(value?.cup?.best,9999),
   last:integer(value?.cup?.last,5,-1)},layout:value?.layout===1?1:0,coupons:integer(value?.coupons,5),host:integer(value?.host,3),buyer:integer(value?.buyer,3),page,
   stamp:page<BOOKINGS.length?integer(value?.stamp,BOOKINGS[page].recipes.length-1):0,
   active:value?.active===true&&page<BOOKINGS.length,
   specialty:integer(value?.specialty,5,-1),reviews:Array.isArray(value?.reviews)?value.reviews.filter(r=>[1,2,3,4,5].includes(r)).slice(-8):[]};
}
export function train(state,id){
 const role=Object.hasOwn(TEAM,id)&&TEAM[id];
 if(!role||state.served<role.at)return false;
 const price=role.costs[state.office[id]];
 if(price===undefined||state.money<price)return false;
 state.money-=price;
 state.office[id]++;
 return true;
}
export function canBook(state,recipeLevel){
 const book=BOOKINGS[state.office.page];
 return !!book&&state.served>=book.at&&book.recipes.every(id=>id<recipeLevel);
}
export function scoreCup(state,{recipe,fast,quality}){
 const cup=state.office.cup;
 if(!cup.active)return '';
 cup.played++;
 cup.score+=10+(fast?15:0)+(quality>=1?15:0)+(recipe!==cup.last?10:0);
 cup.last=recipe;
 if(cup.played<12)return '';
 const result=cup.score;
 cup.active=false;
 cup.best=Math.max(result,cup.best);
 cup.played=0;
 cup.score=0;
 return 'Taça das Doze · '+result+' pontos. Recorde da casa: '+cup.best+'.';
}
export function officeDelivery(state,{booking,recipe,fast,quality,source,finished}){
 const office=state.office;
 if(finished){
   const stars=2+Number(fast)+2*Number(quality>=1);
   office.reviews.push(stars);
   office.reviews=office.reviews.slice(-8);
 }
 const extra=recipe===office.specialty&&quality>=1?4:0;
 state.money+=extra;
 const book=BOOKINGS[office.page];
 if(!office.active||booking!==office.page||!book||recipe!==book.recipes[office.stamp])return {extra};
 if(book.rule==='point'&&quality<1||book.rule==='shelf'&&source!=='shelf'||book.rule==='fast'&&!fast)return {extra,message:'Encomenda precisa ser refeita. '+book.goal};
 office.stamp++;
 if(office.stamp<book.recipes.length)return {extra,message:book.title+' · '+office.stamp+'/'+book.recipes.length+' caixas.'};
 office.page++;
 office.stamp=0;
 office.active=false;
 state.money+=book.reward;
 state.xp+=25;
 return {extra,message:book.title+' concluído! +R$ '+book.reward+' e 25 XP.'};
}
export function stockSnapshot(state,pizzas){
 const stock=[...state.stock];
 for(const p of pizzas){if(p.recipe>=3&&p.recipe<stock.length&&p.stage!=='dough')stock[p.recipe]++;}
 return {...state,stock};
}

export function openOffice({state,recipes,level,show,save,sound,refresh,back,spawn}){
 const office=state.office,book=BOOKINGS[office.page],score=office.reviews.length?office.reviews.reduce((sum,x)=>sum+x,0)/office.reviews.length:0;
 const render=()=>{
   const roles=Object.entries(TEAM).map(([id,r])=>{
     const grade=office[id],price=r.costs[grade];
     return `<article class="card"><h3>${r.name} · ${r.job}</h3><p>“${r.intro}”</p><p>${grade?'Nível '+grade+' de 3. '+r.describe(grade):r.describe(1)}</p>${grade&&grade<3?'<p>Próximo nível · '+r.describe(grade+1)+'</p>':''}${grade<3?`<button data-training="${id}" ${state.served<r.at||state.money<price?'disabled':''}>${state.served<r.at?'Disponível com '+r.at+' entregas':(grade?'Treinar':'Contratar')+' · R$ '+price}</button>`:''}</article>`;
   }).join('');
   const reservation=book?`<h3>${book.title}</h3><p>${book.client} encomendou ${book.recipes.length} caixas. ${book.goal}</p><p>${book.recipes.map((r,i)=>(i<office.stamp?'✓ ':'')+recipes[r].name).join(' / ')}</p><p>${office.stamp}/${book.recipes.length} · R$ ${book.reward} e 25 XP</p><button id="office-book" ${!canBook(state,level())||state.service.active?'disabled':''}>${state.service.active?'Disponível no atendimento livre':office.active?'Suspender encomenda':canBook(state,level())?'Receber encomenda':'Requer '+book.at+' entregas e os sabores indicados'}</button>`:'<h3>Álbum completo</h3><p>Os sete clientes retiraram suas encomendas.</p>';
   show(`<h2>Caderno da casa</h2><p>Caixa · R$ ${state.money}</p><details open><summary>Encomendas · ${office.page}/7</summary>${reservation}</details><details><summary>Equipe do salão</summary>${roles}</details><details><summary>Especialidade da casa</summary><p>Uma receita no ponto rende R$ 4 extras. Escolher um novo destaque custa R$ 12.</p>${recipes.slice(0,level()).map((r,i)=>`<button data-signature="${i}" ${office.specialty===i||state.money<12?'disabled':''}>${office.specialty===i?'✓ ':''}${r.name}</button>`).join('')}</details><details><summary>Organização e divulgação</summary><p>A massa e a bancada podem trocar de lugar. Os círculos de interação acompanham as mesas.</p><button id="office-layout">Inverter massa e bancada</button><p>Distribuir cinco convites dobra a frequência das próximas cinco chegadas no atendimento livre.</p><button id="office-promo" ${office.coupons||state.money<15?'disabled':''}>${office.coupons?office.coupons+' convites em circulação':'Distribuir convites · R$ 15'}</button></details><details><summary>Avaliações · ${score?score.toFixed(1)+'/5':'aguardando mesas'}</summary><p>${office.reviews.length?office.reviews.slice().reverse().map(s=>'★'.repeat(s)+' · '+({2:'Demorou e passou do ponto.',3:'Chegou rápido, mas tostou demais.',4:'Pizza no ponto. A espera foi longa.',5:'Saiu no ponto e chegou depressa!'})[s]).join('<br>'):'As últimas oito mesas deixam um comentário depois da entrega.'}</p></details><button id="office-back">Voltar</button>`);
   document.querySelector('#office-back').onclick=back;
   function commit(){save();refresh();render();}
   document.querySelectorAll('[data-training]').forEach(b=>b.onclick=()=>{if(train(state,b.dataset.training)){sound('purchase');commit();}});
   document.querySelectorAll('[data-signature]').forEach(b=>b.onclick=()=>{const id=Number(b.dataset.signature);if(id<level()&&id!==office.specialty&&state.money>=12){state.money-=12;office.specialty=id;sound('purchase');commit();}});
   document.querySelector('#office-layout').onclick=()=>{office.layout=1-office.layout;commit();};
   document.querySelector('#office-promo').onclick=()=>{if(!office.coupons&&state.money>=15){state.money-=15;office.coupons=5;commit();}};
   const btn=document.querySelector('#office-book');
   if(btn)btn.onclick=()=>{if(!canBook(state,level())||state.service.active)return;office.active=!office.active;if(office.active){state.circuit.active=null;state.shopOpen=true;spawn();}commit();};
   if(office.page===BOOKINGS.length||state.service.complete){
     const cup=office.cup,section=document.createElement('details');
     section.innerHTML=`<summary>Taça das Doze · recorde ${cup.best}</summary><p>Dispute doze entregas. Cada pizza vale dez pontos, mais quinze pela rapidez, quinze pelo ponto e dez ao variar o sabor.</p><p>${cup.active?cup.played+'/12 entregas · '+cup.score+' pontos':'Competição livre para repetir.'}</p><button ${cup.active?'disabled':''}>Iniciar competição</button>`;
     document.querySelector('#office-back').before(section);
     section.querySelector('button').onclick=()=>{if(cup.active)return;Object.assign(cup,{active:true,score:0,played:0,last:-1});commit();};
   }
 };
 render();
}
